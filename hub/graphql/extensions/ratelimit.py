#!/usr/bin/python3
# -*- coding: utf-8 -*-
# Developer: Harold Kim (root@stypr.com)
# https://github.com/stypr/strawberry-ratelimit

"""
ratelimit.py

Strawberry GraphQL ratelimit extension
"""

import re
import time

from collections.abc import Iterable
from typing import Callable, Union
from graphql import (
    ExecutionResult as GraphQLExecutionResult,
    GraphQLError
)
from graphql.language import (
    FieldNode,
    FragmentDefinitionNode,
    FragmentSpreadNode,
    InlineFragmentNode,
    OperationDefinitionNode
)

from strawberry.extensions import Extension
from strawberry.extensions.utils import is_introspection_key
IgnoreType = Union[Callable[[str], bool], re.Pattern, str]

USER_LOG = {}

def flatten(items):
    """ (nested list of strs) -> (list of str|byte)

    Flattening list. Ignoring NoneType.

    >>> list(flatten([["A", None], ["B", ["C", ["D"], None]]]))
    ['A', 'B', 'C', 'D']
    """
    for item in items:
        if item is None:
            pass
        elif isinstance(item, Iterable) and not isinstance(item, (str, bytes)):
            for sub_item in flatten(item):
                yield sub_item
        else:
            yield item

def get_fragments(definitions):
    """ Definitions -> (list of FragmentDefinitionNode)

    Collect fragments from Definitions
    """
    fragments = {}
    for definition in definitions:
        if isinstance(definition, FragmentDefinitionNode):
            fragments[definition.name.value] = definition
    return fragments

def get_queries_and_mutations(definitions):
    """ Definitions -> (list of OperationDefinitionNode)

    Collect definition nodes from Definitions.

    Example:
        Input:
            ```
            query A {
                ...
            }
            mutation B {
                ...
            }
            ```
        Output:
            ```
            [OperationDefinitionNode_A, OperationDefinitionNode_B]
            ```
    """
    operations = {}
    for definition in definitions:
        if isinstance(definition, OperationDefinitionNode):
            operation = definition.name.value if definition.name else "anonymous"
            operations[operation] = definition
    return operations

def is_ignored(node, ignore=None):
    """ (FieldNode, IgnoreType|NoneType) -> bool

    Check if the given node needs to be ignored
    """
    if ignore is None:
        return False

    for rule in ignore:
        field_name = node.name.value
        if isinstance(rule, str):
            if field_name == rule:
                return True
        elif isinstance(rule, re.Pattern):
            if rule.match(field_name):
                return True
        elif callable(rule):
            if rule(field_name):
                return True
        else:
            raise ValueError(f"Invalid ignore option: {rule}")

    return False


def determine_queries_and_mutations(
        node,
        fragments,
        depth_so_far,
        max_depth,
        context,
        operation_name,
        ignore=None
    ):
    """
    This function is to get all queries and mutations from the definition node.
    It checks for the depth-limit at the same time.
    """

    # 1. check if max_depth is not 0 (unlimited)
    # 2. check if we went too deep. (Prevent nested DoS)
    if depth_so_far > max_depth and max_depth != 0:
        error_message = f"Ratelimit: Depth limited to `{max_depth}`."
        context.result = GraphQLExecutionResult(
            data=None,
            errors=[GraphQLError(error_message)],
        )
        return []

    # Query, Mutations, Internal funcs
    if isinstance(node, FieldNode):
        should_ignore = is_introspection_key(node.name.value) or is_ignored(
            node, ignore
        )

        if should_ignore or not node.selection_set:
            return None

        result = [node.name.value]
        return (result +
                list(
                    map(
                        lambda selection: determine_queries_and_mutations(
                            node=selection,
                            fragments=fragments,
                            depth_so_far=depth_so_far + 1,
                            max_depth=max_depth,
                            context=context,
                            operation_name=operation_name,
                            ignore=ignore,
                        ),
                        node.selection_set.selections)
                    )
                )

    # SpreadNode
    elif isinstance(node, FragmentSpreadNode):
        return determine_queries_and_mutations(
            node=fragments[node.name.value],
            fragments=fragments,
            depth_so_far=depth_so_far,
            max_depth=max_depth,
            context=context,
            operation_name=operation_name,
            ignore=ignore,
        )

    # Inline fragments, OperationDefinitionNode
    elif isinstance(
            node,
            (InlineFragmentNode, FragmentDefinitionNode, OperationDefinitionNode)):
        return list(
            map(
                lambda selection: determine_queries_and_mutations(
                    node=selection,
                    fragments=fragments,
                    depth_so_far=depth_so_far,
                    max_depth=max_depth,
                    context=context,
                    operation_name=operation_name,
                    ignore=ignore,
                ),
                node.selection_set.selections,
            )
        )

    # Out of specification?
    else:
        raise Exception(f"Depth cannot be handled: {node.kind}")

def parse_func_list(definitions, context, max_depth):
    """ (DefinitionNode, ExecutionContext, int) -> list of str

    Parse query and gather queries and mutations.
    """
    result = []

    fragments = get_fragments(definitions)
    queries = get_queries_and_mutations(definitions)

    for name in queries:
        parsed_funclist = list(
            flatten(
                determine_queries_and_mutations(
                    node=queries[name],
                    fragments=fragments,
                    depth_so_far=0,
                    max_depth=max_depth,
                    context=context,
                    operation_name=name,
                )
            )
        )
        result.extend(parsed_funclist)
    return result

class ExtensionRatelimit(Extension):
    """
    ExtensionRatelimit
    Ratelimit extension class for Strawberry GraphQL

    {
        '127.0.0.1': {
            'getInfo': [time, time, ...],
            'getUser': [time, time, ...],
            'changeUser': [time, time, ...],
        },
        ...
    }


    `depth_max`: int
        0 means infinite depth. (Not recommended)
        50 by default.

    `call_max`: int
        0 means infinite number of queries or mutations (Not recommended)
        100 by default.

    `rate_name: list of str`
        Names of the query or mutation
        Example: ["getInfo"]

    `rate_max: int`
        Maximum number of access

    `rate_seconds: int`
        Maximum number of seconds

    Example:
        60req/1min
            - rate_max = 60
            - rate_seconds = 60
        60req/1hr
            - rate_max = 60
            - rate_seconds = 3600
    """
    rate_name = [""]
    rate_max = 0
    rate_seconds = 0
    depth_max = 50
    call_max = 100

    def __init__(
            self,
            *,
            type_name=[],
            execution_context={},
            rate_max=10,
            rate_seconds=60,
            depth_max=50,
            call_max=100
        ):
        """ (ExtensionRatelimit, *, ExecutionContext|dict, str, int, int, int)
        """
        self.type_name = type_name
        self.rate_max = rate_max
        self.rate_seconds = rate_seconds
        self.execution_context = execution_context
        self.depth_max = depth_max
        self.call_max = call_max

    def on_executing_start(self):
        """ (ExtensionRatelimit)

        This will be executed right before the actual execution from the backend.
        """

        is_ratelimited = False
        execution_context = self.execution_context
        client_key = execution_context.context['request'].client[0]

        definitions = execution_context.graphql_document.definitions

        # Gather queries and mutations.
        func_list = parse_func_list(definitions, execution_context, self.depth_max)
        if execution_context.errors or not func_list:
            is_ratelimited = True
            return

        # Limiting call count.
        if len(func_list) > self.call_max and self.call_max != 0:
            error_message = f"Ratelimit: Call limited to `{self.call_max}`."
            self.execution_context.result = GraphQLExecutionResult(
                data=None,
                errors=[GraphQLError(error_message)],
            )
            is_ratelimited = True
            return

        # Add clientIP and log
        if client_key not in USER_LOG:
            USER_LOG[client_key] = {}

        # Check if to pass on ratelimit types
        for func_name in self.type_name:
            # Check if the log for the given function exists
            func_log = USER_LOG.get(client_key, {}).get(func_name)
            if func_log:
                # Get recent logs and check if ratelimited
                rate_log = func_log[-self.rate_max:]
                if len(rate_log) != self.rate_max:
                    continue

                if rate_log[0] + self.rate_seconds >= time.time():
                    remaining_time = int(self.rate_seconds-(time.time()-rate_log[0]))
                    error_message = f"Ratelimit: `{func_name}`. Try again after {remaining_time}s"
                    self.execution_context.result = GraphQLExecutionResult(
                        data=None,
                        errors=[GraphQLError(error_message)],
                    )
                    is_ratelimited = True
                    return

        # Log information if not ratelimited
        if not is_ratelimited:
            for func_name in func_list:
                # Check if the function is in the scope
                if func_name in self.type_name:
                    # Add ratelimit[ip][function_name] = [ip,ip,...]
                    # Flush if the length of list is over 10 * rate_max.

                    func_log = USER_LOG.get(client_key).get(func_name, {})
                    if not func_log:
                        USER_LOG[client_key][func_name] = []

                    if len(USER_LOG[client_key][func_name]) >= self.rate_max * 10:
                        USER_LOG[client_key][func_name] = []

                    USER_LOG[client_key][func_name].append(time.time())
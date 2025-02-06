from enum import Enum


# https://procrastinate.readthedocs.io/en/stable/howto/advanced/priorities.html
# We can assign an optional priority to a job. Jobs with higher priority will be preferred by a worker. Priority is represented as an (positive or negative) integer, where a larger number indicates a higher priority. If no priority is specified and no default priority was set on the task itself, it defaults to 0.
# Priority is used as a way to order available jobs. If a procrastinate worker requests a job, and there is a high-priority job scheduled that is blocked by a lock, and a low-priority job that is available, the worker will take the low-priority job. Procrastinate will never wait for a high-priority job to become available if there are lower-priority jobs already available.
class ProcrastinateQueuePriority(Enum):
    # System
    LOWEST = 0
    # Import/export priorities
    VERY_SLOW = 5
    UNGUESSABE = 10
    SLOW = 10
    MEDIUM = 15
    SUPER_QUICK = 20
    # System
    BEFORE_ANY_MORE_IMPORT_EXPORT = 35
    CRITICAL = 50

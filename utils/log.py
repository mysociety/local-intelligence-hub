import logging

def get_simple_debug_logger(name):
    logger = logging.getLogger(name)
    def debug_logger(*args, **kwargs):
        return logger.debug(concat(args), **kwargs)
    setattr(logger, "debug", debug_logger)
    return logger

def concat(*args):
    return "".join([str(a) for a in args])
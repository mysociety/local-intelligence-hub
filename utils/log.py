import logging


def get_simple_debug_logger(name):
    logger = logging.getLogger(name)
    original_makeRecord = logger.makeRecord

    def debug_makeRecord(name, level, fn, lno, msg, args, *rest, **kwargs):
        msg = concat(msg, *(args or []))
        return original_makeRecord(name, level, fn, lno, msg, {}, *rest, **kwargs)

    setattr(logger, "makeRecord", debug_makeRecord)
    return logger


def concat(*args):
    return " ".join([str(a) for a in args])

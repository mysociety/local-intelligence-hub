import re


def is_valid_postcode(postcode):
    pc = postcode.upper().replace(" ", "")

    # See http://www.govtalk.gov.uk/gdsc/html/noframes/PostCode-2-1-Release.htm
    in_re = "ABDEFGHJLNPQRSTUWXYZ"
    fst = "ABCDEFGHIJKLMNOPRSTUWYZ"
    sec = "ABCDEFGHJKLMNOPQRSTUVWXY"
    thd = "ABCDEFGHJKSTUW"
    fth = "ABEHMNPRVWXY"

    patterns = [
        rf"^[{fst}][1-9]\d[{in_re}][{in_re}]$",
        rf"^[{fst}][1-9]\d\d[{in_re}][{in_re}]$",
        rf"^[{fst}][{sec}]\d\d[{in_re}][{in_re}]$",
        rf"^[{fst}][{sec}][1-9]\d\d[{in_re}][{in_re}]$",
        rf"^[{fst}][1-9][{thd}]\d[{in_re}][{in_re}]$",
        rf"^[{fst}][{sec}][1-9][{fth}]\d[{in_re}][{in_re}]$",
    ]

    for pat in patterns:
        if re.search(pat, pc):
            return pc

    return None

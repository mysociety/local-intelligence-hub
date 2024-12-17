import phonenumbers
from phonenumbers.phonenumberutil import NumberParseException

from utils.py import ensure_list


def validate_and_format_phone_number(value, countries=[]):
    """
    Validates and formats a phone number to E164 format if valid, otherwise returns None.
    """
    countries = ensure_list(countries or [])
    if len(countries) == 0:
        countries = ["GB"]
    try:
        phone_number = phonenumbers.parse(value, countries[0])
        if phonenumbers.is_valid_number(phone_number):
            return phonenumbers.format_number(
                phone_number, phonenumbers.PhoneNumberFormat.E164
            )
    except NumberParseException:
        pass
    return None

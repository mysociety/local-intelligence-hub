import math

LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def column_index_to_letters(index: int):
    letters = ""
    while index >= 0:
        letter_index = index % 26
        letters = LETTERS[letter_index] + letters
        index = math.floor(index / 26) - 1
    return letters


def letters_to_column_index(letters: str):
    index = 0
    letters = reversed(list(letters.upper()))
    for i, letter in enumerate(letters):
        letter_index = LETTERS.index(letter)
        if i == 0:
            index += letter_index
        else:
            index += math.pow(26, i) * (letter_index + 1)
    return int(index)

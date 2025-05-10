# app/forbidden_words.py

import re

forbidden_words = [
    'stulbs',
    'muļķīgs',
    'nolādēts',
    'idiots',
    'debīls',
    'popa'
]

def contains_forbidden_word(text):
    pattern = r'\b(' + '|'.join(re.escape(word) for word in forbidden_words) + r')\b'
    return re.search(pattern, text, re.IGNORECASE) is not None
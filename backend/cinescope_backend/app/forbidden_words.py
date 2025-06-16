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

# Funkcija pārbauda, vai tekstā ir kāds no aizliegtajiem vārdiem
def contains_forbidden_word(text):
    # \b — vārda robeža, lai neļautu "apkrāpts" saturēt "krāp" kā daļu
    pattern = r'\b(' + '|'.join(re.escape(word) for word in forbidden_words) + r')\b'
    return re.search(pattern, text, re.IGNORECASE) is not None

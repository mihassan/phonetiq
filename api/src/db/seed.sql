-- Phonetiq seed data: ~200 minimal pairs, categorized and dialect-aware
-- phoneme_type categories: vowel_short, vowel_long, consonant_voicing, consonant_place,
--   fricative, affricate, liquid, sibilant, nasal, approximant
-- dialect_filter: 'all', 'us_only', 'uk_only'

-- ============================================================
-- VOWELS: /ɪ/ vs /iː/ (short I vs long EE)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('ship', 'sheep', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('bit', 'beat', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('slip', 'sleep', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('dip', 'deep', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('fill', 'feel', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('pill', 'peel', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('mill', 'meal', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('still', 'steal', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('hill', 'heel', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('lick', 'leak', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1);

-- ============================================================
-- VOWELS: /e/ vs /æ/ (short E vs short A)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('pen', 'pan', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('men', 'man', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('bed', 'bad', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('head', 'had', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('said', 'sad', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('lend', 'land', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('send', 'sand', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('guess', 'gas', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('peck', 'pack', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('flesh', 'flash', 'vowel_short', '/e/ vs /æ/', 'all', 1);

-- ============================================================
-- VOWELS: /ʊ/ vs /uː/ (short OO vs long OO)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('pull', 'pool', 'vowel_short', '/ʊ/ vs /uː/', 'all', 1),
('full', 'fool', 'vowel_short', '/ʊ/ vs /uː/', 'all', 1),
('look', 'luke', 'vowel_short', '/ʊ/ vs /uː/', 'all', 1),
('wood', 'wooed', 'vowel_short', '/ʊ/ vs /uː/', 'all', 2),
('soot', 'suit', 'vowel_short', '/ʊ/ vs /uː/', 'all', 2),
('could', 'cooed', 'vowel_short', '/ʊ/ vs /uː/', 'all', 2),
('hood', 'who''d', 'vowel_short', '/ʊ/ vs /uː/', 'all', 2),
('put', 'boot', 'vowel_short', '/ʊ/ vs /uː/', 'all', 1);

-- ============================================================
-- VOWELS: /ɒ/ vs /ɔː/ (cot vs caught) - UK ONLY (merged in most US)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('cot', 'caught', 'vowel_long', '/ɒ/ vs /ɔː/', 'uk_only', 2),
('don', 'dawn', 'vowel_long', '/ɒ/ vs /ɔː/', 'uk_only', 2),
('knot', 'naught', 'vowel_long', '/ɒ/ vs /ɔː/', 'uk_only', 2),
('stock', 'stalk', 'vowel_long', '/ɒ/ vs /ɔː/', 'uk_only', 2),
('nod', 'gnawed', 'vowel_long', '/ɒ/ vs /ɔː/', 'uk_only', 2),
('pond', 'pawned', 'vowel_long', '/ɒ/ vs /ɔː/', 'uk_only', 2),
('tot', 'taught', 'vowel_long', '/ɒ/ vs /ɔː/', 'uk_only', 2),
('wok', 'walk', 'vowel_long', '/ɒ/ vs /ɔː/', 'uk_only', 2);

-- ============================================================
-- VOWELS: /ʌ/ vs /ɑː/ (hut vs heart) - UK ONLY (rhotic)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('hut', 'heart', 'vowel_long', '/ʌ/ vs /ɑː/', 'uk_only', 2),
('cut', 'cart', 'vowel_long', '/ʌ/ vs /ɑː/', 'uk_only', 2),
('duck', 'dark', 'vowel_long', '/ʌ/ vs /ɑː/', 'uk_only', 2),
('much', 'march', 'vowel_long', '/ʌ/ vs /ɑː/', 'uk_only', 2),
('luck', 'lark', 'vowel_long', '/ʌ/ vs /ɑː/', 'uk_only', 2),
('buck', 'bark', 'vowel_long', '/ʌ/ vs /ɑː/', 'uk_only', 2),
('puck', 'park', 'vowel_long', '/ʌ/ vs /ɑː/', 'uk_only', 2),
('muck', 'mark', 'vowel_long', '/ʌ/ vs /ɑː/', 'uk_only', 2);

-- ============================================================
-- VOWELS: /ʌ/ vs /æ/ (cup vs cap)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('cup', 'cap', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1),
('mud', 'mad', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1),
('bug', 'bag', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1),
('rug', 'rag', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1),
('hug', 'hag', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1),
('run', 'ran', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1),
('fun', 'fan', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1),
('bun', 'ban', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1);

-- ============================================================
-- VOWELS: /eɪ/ vs /e/ (mate vs met)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('mate', 'met', 'vowel_long', '/eɪ/ vs /e/', 'all', 1),
('late', 'let', 'vowel_long', '/eɪ/ vs /e/', 'all', 1),
('pain', 'pen', 'vowel_long', '/eɪ/ vs /e/', 'all', 1),
('wait', 'wet', 'vowel_long', '/eɪ/ vs /e/', 'all', 1),
('tale', 'tell', 'vowel_long', '/eɪ/ vs /e/', 'all', 1),
('raid', 'red', 'vowel_long', '/eɪ/ vs /e/', 'all', 1),
('gate', 'get', 'vowel_long', '/eɪ/ vs /e/', 'all', 1),
('main', 'men', 'vowel_long', '/eɪ/ vs /e/', 'all', 1);

-- ============================================================
-- CONSONANTS: /p/ vs /b/ (voicing)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('pie', 'buy', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('pat', 'bat', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('pig', 'big', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('pack', 'back', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('pear', 'bear', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('cap', 'cab', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('cup', 'cub', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('rope', 'robe', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('mop', 'mob', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('lap', 'lab', 'consonant_voicing', '/p/ vs /b/', 'all', 1);

-- ============================================================
-- CONSONANTS: /t/ vs /d/ (voicing)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('tie', 'die', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('tear', 'dear', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('town', 'down', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('tank', 'dank', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('try', 'dry', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('hat', 'had', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('mat', 'mad', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('set', 'said', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('hit', 'hid', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('rate', 'raid', 'consonant_voicing', '/t/ vs /d/', 'all', 1);

-- ============================================================
-- CONSONANTS: /k/ vs /ɡ/ (voicing)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('cap', 'gap', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('coat', 'goat', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('class', 'glass', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('curl', 'girl', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('crow', 'grow', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('back', 'bag', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('lack', 'lag', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('tack', 'tag', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('pick', 'pig', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('peck', 'peg', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1);

-- ============================================================
-- CONSONANTS: /f/ vs /v/ (voicing)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('fan', 'van', 'consonant_voicing', '/f/ vs /v/', 'all', 1),
('fast', 'vast', 'consonant_voicing', '/f/ vs /v/', 'all', 1),
('fault', 'vault', 'consonant_voicing', '/f/ vs /v/', 'all', 1),
('ferry', 'very', 'consonant_voicing', '/f/ vs /v/', 'all', 1),
('fat', 'vat', 'consonant_voicing', '/f/ vs /v/', 'all', 1),
('leaf', 'leave', 'consonant_voicing', '/f/ vs /v/', 'all', 1),
('half', 'halve', 'consonant_voicing', '/f/ vs /v/', 'all', 1),
('safe', 'save', 'consonant_voicing', '/f/ vs /v/', 'all', 1),
('proof', 'prove', 'consonant_voicing', '/f/ vs /v/', 'all', 1),
('strife', 'strive', 'consonant_voicing', '/f/ vs /v/', 'all', 2);

-- ============================================================
-- CONSONANTS: /s/ vs /z/ (voicing)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('sip', 'zip', 'consonant_voicing', '/s/ vs /z/', 'all', 1),
('seal', 'zeal', 'consonant_voicing', '/s/ vs /z/', 'all', 1),
('ice', 'eyes', 'consonant_voicing', '/s/ vs /z/', 'all', 1),
('bus', 'buzz', 'consonant_voicing', '/s/ vs /z/', 'all', 1),
('price', 'prize', 'consonant_voicing', '/s/ vs /z/', 'all', 1),
('place', 'plays', 'consonant_voicing', '/s/ vs /z/', 'all', 1),
('rice', 'rise', 'consonant_voicing', '/s/ vs /z/', 'all', 1),
('lace', 'laze', 'consonant_voicing', '/s/ vs /z/', 'all', 2);

-- ============================================================
-- FRICATIVES: /θ/ vs /t/ (TH vs T - dental)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('think', 'tink', 'fricative', '/θ/ vs /t/', 'all', 2),
('thought', 'taught', 'fricative', '/θ/ vs /t/', 'all', 2),
('three', 'tree', 'fricative', '/θ/ vs /t/', 'all', 1),
('thick', 'tick', 'fricative', '/θ/ vs /t/', 'all', 1),
('thin', 'tin', 'fricative', '/θ/ vs /t/', 'all', 1),
('theme', 'team', 'fricative', '/θ/ vs /t/', 'all', 1),
('thumb', 'tum', 'fricative', '/θ/ vs /t/', 'all', 2),
('bath', 'bat', 'fricative', '/θ/ vs /t/', 'all', 1);

-- ============================================================
-- FRICATIVES: /θ/ vs /s/ (TH vs S)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('think', 'sink', 'fricative', '/θ/ vs /s/', 'all', 1),
('thick', 'sick', 'fricative', '/θ/ vs /s/', 'all', 1),
('thing', 'sing', 'fricative', '/θ/ vs /s/', 'all', 1),
('thumb', 'sum', 'fricative', '/θ/ vs /s/', 'all', 1),
('thaw', 'saw', 'fricative', '/θ/ vs /s/', 'all', 1),
('path', 'pass', 'fricative', '/θ/ vs /s/', 'all', 1),
('mouth', 'mouse', 'fricative', '/θ/ vs /s/', 'all', 2),
('faith', 'face', 'fricative', '/θ/ vs /s/', 'all', 2);

-- ============================================================
-- FRICATIVES: /θ/ vs /f/ (TH vs F)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('three', 'free', 'fricative', '/θ/ vs /f/', 'all', 1),
('throw', 'fro', 'fricative', '/θ/ vs /f/', 'all', 2),
('thirst', 'first', 'fricative', '/θ/ vs /f/', 'all', 1),
('thin', 'fin', 'fricative', '/θ/ vs /f/', 'all', 1),
('thought', 'fought', 'fricative', '/θ/ vs /f/', 'all', 1),
('thread', 'Fred', 'fricative', '/θ/ vs /f/', 'all', 2);

-- ============================================================
-- FRICATIVES: /ð/ vs /d/ (voiced TH vs D)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('they', 'day', 'fricative', '/ð/ vs /d/', 'all', 1),
('there', 'dare', 'fricative', '/ð/ vs /d/', 'all', 1),
('then', 'den', 'fricative', '/ð/ vs /d/', 'all', 1),
('those', 'doze', 'fricative', '/ð/ vs /d/', 'all', 2),
('though', 'dough', 'fricative', '/ð/ vs /d/', 'all', 2),
('breathe', 'breed', 'fricative', '/ð/ vs /d/', 'all', 2);

-- ============================================================
-- SIBILANTS: /s/ vs /ʃ/ (S vs SH)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('see', 'she', 'sibilant', '/s/ vs /ʃ/', 'all', 1),
('seat', 'sheet', 'sibilant', '/s/ vs /ʃ/', 'all', 1),
('sign', 'shine', 'sibilant', '/s/ vs /ʃ/', 'all', 1),
('sip', 'ship', 'sibilant', '/s/ vs /ʃ/', 'all', 1),
('sort', 'short', 'sibilant', '/s/ vs /ʃ/', 'all', 1),
('mass', 'mash', 'sibilant', '/s/ vs /ʃ/', 'all', 1),
('mess', 'mesh', 'sibilant', '/s/ vs /ʃ/', 'all', 1),
('ass', 'ash', 'sibilant', '/s/ vs /ʃ/', 'all', 1);

-- ============================================================
-- AFFRICATES: /tʃ/ vs /ʃ/ (CH vs SH)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('chair', 'share', 'affricate', '/tʃ/ vs /ʃ/', 'all', 1),
('choose', 'shoes', 'affricate', '/tʃ/ vs /ʃ/', 'all', 1),
('catch', 'cash', 'affricate', '/tʃ/ vs /ʃ/', 'all', 1),
('watch', 'wash', 'affricate', '/tʃ/ vs /ʃ/', 'all', 1),
('chip', 'ship', 'affricate', '/tʃ/ vs /ʃ/', 'all', 1),
('chop', 'shop', 'affricate', '/tʃ/ vs /ʃ/', 'all', 1);

-- ============================================================
-- AFFRICATES: /tʃ/ vs /dʒ/ (CH vs J)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('cheap', 'jeep', 'affricate', '/tʃ/ vs /dʒ/', 'all', 1),
('choke', 'joke', 'affricate', '/tʃ/ vs /dʒ/', 'all', 1),
('rich', 'ridge', 'affricate', '/tʃ/ vs /dʒ/', 'all', 2),
('batch', 'badge', 'affricate', '/tʃ/ vs /dʒ/', 'all', 2),
('chin', 'gin', 'affricate', '/tʃ/ vs /dʒ/', 'all', 1),
('chest', 'jest', 'affricate', '/tʃ/ vs /dʒ/', 'all', 1);

-- ============================================================
-- APPROXIMANTS: /v/ vs /w/
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('vet', 'wet', 'approximant', '/v/ vs /w/', 'all', 1),
('vine', 'wine', 'approximant', '/v/ vs /w/', 'all', 1),
('vest', 'west', 'approximant', '/v/ vs /w/', 'all', 1),
('vow', 'wow', 'approximant', '/v/ vs /w/', 'all', 1),
('veil', 'wail', 'approximant', '/v/ vs /w/', 'all', 1),
('verse', 'worse', 'approximant', '/v/ vs /w/', 'all', 2);

-- ============================================================
-- LIQUIDS: /l/ vs /r/
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('light', 'right', 'liquid', '/l/ vs /r/', 'all', 1),
('load', 'road', 'liquid', '/l/ vs /r/', 'all', 1),
('lock', 'rock', 'liquid', '/l/ vs /r/', 'all', 1),
('long', 'wrong', 'liquid', '/l/ vs /r/', 'all', 1),
('lead', 'read', 'liquid', '/l/ vs /r/', 'all', 1),
('glass', 'grass', 'liquid', '/l/ vs /r/', 'all', 1),
('fly', 'fry', 'liquid', '/l/ vs /r/', 'all', 1),
('play', 'pray', 'liquid', '/l/ vs /r/', 'all', 1),
('climb', 'crime', 'liquid', '/l/ vs /r/', 'all', 2),
('blue', 'brew', 'liquid', '/l/ vs /r/', 'all', 1),
('lane', 'rain', 'liquid', '/l/ vs /r/', 'all', 1),
('lice', 'rice', 'liquid', '/l/ vs /r/', 'all', 1);

-- ============================================================
-- NASALS: /n/ vs /ŋ/ (N vs NG)
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('thin', 'thing', 'nasal', '/n/ vs /ŋ/', 'all', 1),
('win', 'wing', 'nasal', '/n/ vs /ŋ/', 'all', 1),
('sin', 'sing', 'nasal', '/n/ vs /ŋ/', 'all', 1),
('ban', 'bang', 'nasal', '/n/ vs /ŋ/', 'all', 1),
('run', 'rung', 'nasal', '/n/ vs /ŋ/', 'all', 1),
('ton', 'tongue', 'nasal', '/n/ vs /ŋ/', 'all', 2);

-- ============================================================
-- NASALS: /m/ vs /n/
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('some', 'sun', 'nasal', '/m/ vs /n/', 'all', 1),
('warm', 'warn', 'nasal', '/m/ vs /n/', 'all', 1),
('lime', 'line', 'nasal', '/m/ vs /n/', 'all', 1),
('came', 'cane', 'nasal', '/m/ vs /n/', 'all', 1),
('seem', 'seen', 'nasal', '/m/ vs /n/', 'all', 1),
('trim', 'trin', 'nasal', '/m/ vs /n/', 'all', 2);

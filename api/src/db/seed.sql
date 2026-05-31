-- Phonetiq seed data: ~200 minimal pairs, categorized and dialect-aware
-- phoneme_type categories: vowel_short, vowel_long, consonant_voicing, consonant_place,
--   fricative, affricate, liquid, sibilant, nasal, approximant
-- dialect_filter: 'all', 'us_only', 'uk_only', 'au_only'

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
-- VOWELS: /ʌ/ vs /ɑː/ (hut vs heart) - NON-RHOTIC PILOT FAMILY
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('hut', 'heart', 'vowel_long', '/ʌ/ vs /ɑː/', 'all', 2),
('cut', 'cart', 'vowel_long', '/ʌ/ vs /ɑː/', 'all', 2),
('duck', 'dark', 'vowel_long', '/ʌ/ vs /ɑː/', 'all', 2),
('much', 'march', 'vowel_long', '/ʌ/ vs /ɑː/', 'all', 2),
('luck', 'lark', 'vowel_long', '/ʌ/ vs /ɑː/', 'all', 2),
('buck', 'bark', 'vowel_long', '/ʌ/ vs /ɑː/', 'all', 2),
('puck', 'park', 'vowel_long', '/ʌ/ vs /ɑː/', 'all', 2),
('muck', 'mark', 'vowel_long', '/ʌ/ vs /ɑː/', 'all', 2);

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

-- ============================================================
-- VOWELS: /ɪ/ vs /iː/ (short I vs long EE) - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('chip', 'cheap', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('fit', 'feet', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('grin', 'green', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('grit', 'greet', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('hit', 'heat', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('lip', 'leap', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('pick', 'peak', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('rid', 'reed', 'vowel_short', '/ɪ/ vs /iː/', 'all', 2),
('sick', 'seek', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('sit', 'seat', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('tin', 'teen', 'vowel_short', '/ɪ/ vs /iː/', 'all', 1),
('wick', 'week', 'vowel_short', '/ɪ/ vs /iː/', 'all', 2);

-- ============================================================
-- VOWELS: /e/ vs /æ/ (short E vs short A) - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('beg', 'bag', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('bet', 'bat', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('dead', 'dad', 'vowel_short', '/e/ vs /æ/', 'all', 2),
('den', 'dan', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('gem', 'jam', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('hem', 'ham', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('leg', 'lag', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('met', 'mat', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('neck', 'knack', 'vowel_short', '/e/ vs /æ/', 'all', 2),
('pet', 'pat', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('set', 'sat', 'vowel_short', '/e/ vs /æ/', 'all', 1),
('ten', 'tan', 'vowel_short', '/e/ vs /æ/', 'all', 1);

-- ============================================================
-- VOWELS: /ʊ/ vs /uː/ (short OO vs long OO) - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('book', 'boo', 'vowel_short', '/ʊ/ vs /uː/', 'all', 1),
('cook', 'coo', 'vowel_short', '/ʊ/ vs /uː/', 'all', 1),
('foot', 'food', 'vowel_short', '/ʊ/ vs /uː/', 'all', 1),
('hook', 'who', 'vowel_short', '/ʊ/ vs /uː/', 'all', 2),
('look', 'loot', 'vowel_short', '/ʊ/ vs /uː/', 'all', 2),
('nook', 'noon', 'vowel_short', '/ʊ/ vs /uː/', 'all', 2),
('shook', 'shoo', 'vowel_short', '/ʊ/ vs /uː/', 'all', 2),
('should', 'shooed', 'vowel_short', '/ʊ/ vs /uː/', 'all', 3),
('took', 'too', 'vowel_short', '/ʊ/ vs /uː/', 'all', 1),
('wool', 'woo', 'vowel_short', '/ʊ/ vs /uː/', 'all', 2);

-- ============================================================
-- VOWELS: /ʌ/ vs /æ/ (cup vs cap) - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('bud', 'bad', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1),
('cub', 'cab', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1),
('cut', 'cat', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1),
('dub', 'dab', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1),
('hut', 'hat', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1),
('luck', 'lack', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1),
('must', 'mast', 'vowel_short', '/ʌ/ vs /æ/', 'all', 2),
('punt', 'pant', 'vowel_short', '/ʌ/ vs /æ/', 'all', 2),
('sum', 'sam', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1),
('tub', 'tab', 'vowel_short', '/ʌ/ vs /æ/', 'all', 1);

-- ============================================================
-- VOWELS: /aɪ/ vs /ɪ/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('bite', 'bit', 'vowel_long', '/aɪ/ vs /ɪ/', 'all', 1),
('cite', 'sit', 'vowel_long', '/aɪ/ vs /ɪ/', 'all', 1),
('dine', 'din', 'vowel_long', '/aɪ/ vs /ɪ/', 'all', 1),
('fine', 'fin', 'vowel_long', '/aɪ/ vs /ɪ/', 'all', 1),
('kite', 'kit', 'vowel_long', '/aɪ/ vs /ɪ/', 'all', 1),
('like', 'lick', 'vowel_long', '/aɪ/ vs /ɪ/', 'all', 1),
('pine', 'pin', 'vowel_long', '/aɪ/ vs /ɪ/', 'all', 1),
('ripe', 'rip', 'vowel_long', '/aɪ/ vs /ɪ/', 'all', 1),
('wife', 'if', 'vowel_long', '/aɪ/ vs /ɪ/', 'all', 2),
('wine', 'win', 'vowel_long', '/aɪ/ vs /ɪ/', 'all', 1),
('wipe', 'whip', 'vowel_long', '/aɪ/ vs /ɪ/', 'all', 1),
('wide', 'with', 'vowel_long', '/aɪ/ vs /ɪ/', 'all', 3);

-- ============================================================
-- VOWELS: /eɪ/ vs /e/ (mate vs met) - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('bait', 'bet', 'vowel_long', '/eɪ/ vs /e/', 'all', 1),
('cane', 'ken', 'vowel_long', '/eɪ/ vs /e/', 'all', 1),
('date', 'debt', 'vowel_long', '/eɪ/ vs /e/', 'all', 1),
('fade', 'fed', 'vowel_long', '/eɪ/ vs /e/', 'all', 1),
('gait', 'get', 'vowel_long', '/eɪ/ vs /e/', 'all', 2),
('laid', 'led', 'vowel_long', '/eɪ/ vs /e/', 'all', 2),
('paint', 'pent', 'vowel_long', '/eɪ/ vs /e/', 'all', 2),
('sail', 'sell', 'vowel_long', '/eɪ/ vs /e/', 'all', 1),
('wade', 'wed', 'vowel_long', '/eɪ/ vs /e/', 'all', 1),
('waste', 'west', 'vowel_long', '/eɪ/ vs /e/', 'all', 2);

-- ============================================================
-- VOWELS: /oʊ/ vs /ɔ/ (US only) - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('boat', 'bought', 'vowel_long', '/oʊ/ vs /ɔ/', 'us_only', 2),
('bowl', 'ball', 'vowel_long', '/oʊ/ vs /ɔ/', 'us_only', 2),
('coat', 'cot', 'vowel_long', '/oʊ/ vs /ɔ/', 'us_only', 2),
('cold', 'called', 'vowel_long', '/oʊ/ vs /ɔ/', 'us_only', 3),
('goat', 'got', 'vowel_long', '/oʊ/ vs /ɔ/', 'us_only', 2),
('loan', 'lawn', 'vowel_long', '/oʊ/ vs /ɔ/', 'us_only', 3),
('load', 'laud', 'vowel_long', '/oʊ/ vs /ɔ/', 'us_only', 3),
('pole', 'Paul', 'vowel_long', '/oʊ/ vs /ɔ/', 'us_only', 3),
('road', 'rod', 'vowel_long', '/oʊ/ vs /ɔ/', 'us_only', 2),
('soap', 'sop', 'vowel_long', '/oʊ/ vs /ɔ/', 'us_only', 2);

-- ============================================================
-- VOWELS: /ɑr/ vs /ɔr/ (US only, rhotic) - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('bar', 'bore', 'vowel_long', '/ɑr/ vs /ɔr/', 'us_only', 2),
('car', 'core', 'vowel_long', '/ɑr/ vs /ɔr/', 'us_only', 2),
('card', 'cord', 'vowel_long', '/ɑr/ vs /ɔr/', 'us_only', 3),
('dark', 'dork', 'vowel_long', '/ɑr/ vs /ɔr/', 'us_only', 3),
('farm', 'form', 'vowel_long', '/ɑr/ vs /ɔr/', 'us_only', 3),
('hard', 'hoard', 'vowel_long', '/ɑr/ vs /ɔr/', 'us_only', 3),
('par', 'pore', 'vowel_long', '/ɑr/ vs /ɔr/', 'us_only', 2),
('part', 'port', 'vowel_long', '/ɑr/ vs /ɔr/', 'us_only', 4),
('star', 'store', 'vowel_long', '/ɑr/ vs /ɔr/', 'us_only', 3),
('tar', 'tore', 'vowel_long', '/ɑr/ vs /ɔr/', 'us_only', 2);

-- ============================================================
-- CONSONANTS: /p/ vs /b/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('pad', 'bad', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('pale', 'bale', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('pan', 'ban', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('park', 'bark', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('pea', 'bee', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('peach', 'beach', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('perry', 'berry', 'consonant_voicing', '/p/ vs /b/', 'all', 2),
('pill', 'bill', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('pit', 'bit', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('pore', 'bore', 'consonant_voicing', '/p/ vs /b/', 'all', 2),
('pull', 'bull', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('punt', 'bunt', 'consonant_voicing', '/p/ vs /b/', 'all', 2),
('push', 'bush', 'consonant_voicing', '/p/ vs /b/', 'all', 1),
('pain', 'bane', 'consonant_voicing', '/p/ vs /b/', 'all', 2);

-- ============================================================
-- CONSONANTS: /t/ vs /d/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('tale', 'dale', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('tart', 'dart', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('team', 'deem', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('ten', 'den', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('time', 'dime', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('tin', 'din', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('tip', 'dip', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('tire', 'dire', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('tone', 'done', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('tub', 'dub', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('tuck', 'duck', 'consonant_voicing', '/t/ vs /d/', 'all', 1),
('tune', 'dune', 'consonant_voicing', '/t/ vs /d/', 'all', 2);

-- ============================================================
-- CONSONANTS: /k/ vs /ɡ/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('came', 'game', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('cane', 'gain', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('cape', 'gape', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('coal', 'goal', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('cold', 'gold', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('core', 'gore', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('cot', 'got', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('crab', 'grab', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('crate', 'grate', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('cut', 'gut', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('clue', 'glue', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 1),
('coast', 'ghost', 'consonant_voicing', '/k/ vs /ɡ/', 'all', 2);

-- ============================================================
-- FRICATIVES: /f/ vs /v/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('fear', 'veer', 'fricative', '/f/ vs /v/', 'all', 2),
('feel', 'veal', 'fricative', '/f/ vs /v/', 'all', 2),
('few', 'view', 'fricative', '/f/ vs /v/', 'all', 2),
('file', 'vile', 'fricative', '/f/ vs /v/', 'all', 1),
('fine', 'vine', 'fricative', '/f/ vs /v/', 'all', 1),
('foal', 'vole', 'fricative', '/f/ vs /v/', 'all', 2),
('phase', 'vase', 'fricative', '/f/ vs /v/', 'all', 3);

-- ============================================================
-- CONSONANTS: /s/ vs /z/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('advice', 'advise', 'consonant_voicing', '/s/ vs /z/', 'all', 3),
('cease', 'seize', 'consonant_voicing', '/s/ vs /z/', 'all', 2),
('close', 'cloze', 'consonant_voicing', '/s/ vs /z/', 'all', 4),
('dose', 'doze', 'consonant_voicing', '/s/ vs /z/', 'all', 2),
('loose', 'lose', 'consonant_voicing', '/s/ vs /z/', 'all', 3),
('race', 'raze', 'consonant_voicing', '/s/ vs /z/', 'all', 2),
('sue', 'zoo', 'consonant_voicing', '/s/ vs /z/', 'all', 1),
('use', 'ooze', 'consonant_voicing', '/s/ vs /z/', 'all', 4);

-- ============================================================
-- FRICATIVES: /θ/ vs /t/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('thank', 'tank', 'fricative', '/θ/ vs /t/', 'all', 1),
('thaw', 'taw', 'fricative', '/θ/ vs /t/', 'all', 2),
('thigh', 'tie', 'fricative', '/θ/ vs /t/', 'all', 2),
('thing', 'ting', 'fricative', '/θ/ vs /t/', 'all', 2),
('thong', 'tong', 'fricative', '/θ/ vs /t/', 'all', 3),
('thorn', 'torn', 'fricative', '/θ/ vs /t/', 'all', 2);

-- ============================================================
-- FRICATIVES: /θ/ vs /s/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('thank', 'sank', 'fricative', '/θ/ vs /s/', 'all', 2),
('theme', 'seam', 'fricative', '/θ/ vs /s/', 'all', 2),
('thin', 'sin', 'fricative', '/θ/ vs /s/', 'all', 1),
('thigh', 'sigh', 'fricative', '/θ/ vs /s/', 'all', 2),
('thought', 'sought', 'fricative', '/θ/ vs /s/', 'all', 3);

-- ============================================================
-- FRICATIVES: /ð/ vs /d/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('thee', 'dee', 'fricative', '/ð/ vs /d/', 'all', 2),
('their', 'dare', 'fricative', '/ð/ vs /d/', 'all', 2),
('this', 'dis', 'fricative', '/ð/ vs /d/', 'all', 3),
('thy', 'die', 'fricative', '/ð/ vs /d/', 'all', 3);

-- ============================================================
-- AFFRICATES: /tʃ/ vs /ʃ/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('cheap', 'sheep', 'affricate', '/tʃ/ vs /ʃ/', 'all', 1),
('cheer', 'sheer', 'affricate', '/tʃ/ vs /ʃ/', 'all', 2),
('chin', 'shin', 'affricate', '/tʃ/ vs /ʃ/', 'all', 1),
('chore', 'shore', 'affricate', '/tʃ/ vs /ʃ/', 'all', 2),
('chew', 'shoe', 'affricate', '/tʃ/ vs /ʃ/', 'all', 2);

-- ============================================================
-- AFFRICATES: /tʃ/ vs /dʒ/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('char', 'jar', 'affricate', '/tʃ/ vs /dʒ/', 'all', 2),
('cheer', 'jeer', 'affricate', '/tʃ/ vs /dʒ/', 'all', 2),
('chive', 'jive', 'affricate', '/tʃ/ vs /dʒ/', 'all', 3),
('chunk', 'junk', 'affricate', '/tʃ/ vs /dʒ/', 'all', 2),
('chump', 'jump', 'affricate', '/tʃ/ vs /dʒ/', 'all', 2);

-- ============================================================
-- SIBILANTS: /s/ vs /ʃ/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('sack', 'shack', 'sibilant', '/s/ vs /ʃ/', 'all', 1),
('sail', 'shale', 'sibilant', '/s/ vs /ʃ/', 'all', 2),
('sake', 'shake', 'sibilant', '/s/ vs /ʃ/', 'all', 2),
('same', 'shame', 'sibilant', '/s/ vs /ʃ/', 'all', 1),
('save', 'shave', 'sibilant', '/s/ vs /ʃ/', 'all', 1),
('scene', 'sheen', 'sibilant', '/s/ vs /ʃ/', 'all', 2),
('self', 'shelf', 'sibilant', '/s/ vs /ʃ/', 'all', 2),
('sell', 'shell', 'sibilant', '/s/ vs /ʃ/', 'all', 1),
('seep', 'sheep', 'sibilant', '/s/ vs /ʃ/', 'all', 2),
('sock', 'shock', 'sibilant', '/s/ vs /ʃ/', 'all', 1),
('sore', 'shore', 'sibilant', '/s/ vs /ʃ/', 'all', 2),
('sun', 'shun', 'sibilant', '/s/ vs /ʃ/', 'all', 1);

-- ============================================================
-- LIQUIDS: /l/ vs /r/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('lace', 'race', 'liquid', '/l/ vs /r/', 'all', 1),
('lack', 'rack', 'liquid', '/l/ vs /r/', 'all', 1),
('lag', 'rag', 'liquid', '/l/ vs /r/', 'all', 1),
('lake', 'rake', 'liquid', '/l/ vs /r/', 'all', 1),
('lap', 'rap', 'liquid', '/l/ vs /r/', 'all', 1),
('late', 'rate', 'liquid', '/l/ vs /r/', 'all', 1),
('law', 'raw', 'liquid', '/l/ vs /r/', 'all', 1),
('lay', 'ray', 'liquid', '/l/ vs /r/', 'all', 1),
('leap', 'reap', 'liquid', '/l/ vs /r/', 'all', 1),
('led', 'red', 'liquid', '/l/ vs /r/', 'all', 1),
('leak', 'reek', 'liquid', '/l/ vs /r/', 'all', 2),
('lend', 'rend', 'liquid', '/l/ vs /r/', 'all', 2),
('lip', 'rip', 'liquid', '/l/ vs /r/', 'all', 1),
('live', 'rive', 'liquid', '/l/ vs /r/', 'all', 2),
('lobe', 'robe', 'liquid', '/l/ vs /r/', 'all', 2),
('lone', 'roan', 'liquid', '/l/ vs /r/', 'all', 2),
('loom', 'room', 'liquid', '/l/ vs /r/', 'all', 1),
('low', 'row', 'liquid', '/l/ vs /r/', 'all', 1),
('luck', 'ruck', 'liquid', '/l/ vs /r/', 'all', 2),
('louse', 'rouse', 'liquid', '/l/ vs /r/', 'all', 3),
('lime', 'rhyme', 'liquid', '/l/ vs /r/', 'all', 3);

-- ============================================================
-- APPROXIMANTS: /v/ vs /w/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('vale', 'wale', 'approximant', '/v/ vs /w/', 'all', 2),
('vane', 'wane', 'approximant', '/v/ vs /w/', 'all', 2),
('vary', 'wary', 'approximant', '/v/ vs /w/', 'all', 2),
('vat', 'watt', 'approximant', '/v/ vs /w/', 'all', 1),
('veal', 'wheel', 'approximant', '/v/ vs /w/', 'all', 2),
('veil', 'whale', 'approximant', '/v/ vs /w/', 'all', 2),
('vent', 'went', 'approximant', '/v/ vs /w/', 'all', 1),
('vice', 'wise', 'approximant', '/v/ vs /w/', 'all', 2),
('vie', 'why', 'approximant', '/v/ vs /w/', 'all', 1),
('vile', 'while', 'approximant', '/v/ vs /w/', 'all', 2);

-- ============================================================
-- NASALS: /n/ vs /ŋ/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('bin', 'bing', 'nasal', '/n/ vs /ŋ/', 'all', 1),
('bun', 'bung', 'nasal', '/n/ vs /ŋ/', 'all', 2),
('fan', 'fang', 'nasal', '/n/ vs /ŋ/', 'all', 1),
('kin', 'king', 'nasal', '/n/ vs /ŋ/', 'all', 1),
('pin', 'ping', 'nasal', '/n/ vs /ŋ/', 'all', 1),
('ran', 'rang', 'nasal', '/n/ vs /ŋ/', 'all', 1),
('son', 'song', 'nasal', '/n/ vs /ŋ/', 'all', 1),
('sun', 'sung', 'nasal', '/n/ vs /ŋ/', 'all', 2),
('tan', 'tang', 'nasal', '/n/ vs /ŋ/', 'all', 1),
('tin', 'ting', 'nasal', '/n/ vs /ŋ/', 'all', 2);

-- ============================================================
-- NASALS: /m/ vs /n/ - EXPANSION
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('beam', 'bean', 'nasal', '/m/ vs /n/', 'all', 1),
('boom', 'boon', 'nasal', '/m/ vs /n/', 'all', 2),
('dim', 'din', 'nasal', '/m/ vs /n/', 'all', 1),
('fame', 'fane', 'nasal', '/m/ vs /n/', 'all', 2),
('home', 'hone', 'nasal', '/m/ vs /n/', 'all', 1),
('ram', 'ran', 'nasal', '/m/ vs /n/', 'all', 1),
('same', 'sane', 'nasal', '/m/ vs /n/', 'all', 1),
('teem', 'teen', 'nasal', '/m/ vs /n/', 'all', 2),
('time', 'tine', 'nasal', '/m/ vs /n/', 'all', 2),
('room', 'rune', 'nasal', '/m/ vs /n/', 'all', 3);

-- ============================================================
-- VOWELS: Initial AU-focused starter set
-- ============================================================
INSERT INTO word_pairs (word1, word2, phoneme_type, target_sounds, dialect_filter, difficulty_level) VALUES
('ferry', 'fairy', 'vowel_long', '/e/ vs /eː/', 'au_only', 3),
('merry', 'marry', 'vowel_long', '/e/ vs /æ/', 'au_only', 3),
('kerry', 'carry', 'vowel_long', '/e/ vs /æ/', 'au_only', 3),
('peer', 'pear', 'vowel_long', '/ɪə/ vs /eː/', 'au_only', 3),
('beer', 'bear', 'vowel_long', '/ɪə/ vs /eː/', 'au_only', 3),
('dear', 'dare', 'vowel_long', '/ɪə/ vs /eː/', 'au_only', 3),
('cheer', 'chair', 'vowel_long', '/ɪə/ vs /eː/', 'au_only', 3),
('near', 'nair', 'vowel_long', '/ɪə/ vs /eː/', 'au_only', 3),
('tier', 'tear', 'vowel_long', '/ɪə/ vs /eː/', 'au_only', 3),
('weary', 'wary', 'vowel_long', '/ɪə/ vs /eː/', 'au_only', 4),
('seer', 'sayer', 'vowel_long', '/ɪə/ vs /eː/', 'au_only', 4),
('hear', 'hair', 'vowel_long', '/ɪə/ vs /eː/', 'au_only', 3);

-- ============================================================
-- PILOT DIALECT METADATA: vowel_long
-- Marks pilot contrast strength for dialect-sensitive vowel_long families.
-- Uses lookup subqueries so metadata stays aligned if seed row ordering changes.
-- ============================================================
INSERT INTO word_pair_dialect_metadata (pair_id, target_dialect, contrast_strength, note)
SELECT id, 'uk_only', 'supported', 'Distinct /ɒ/ vs /ɔː/ contrast for the current UK pilot set.'
FROM word_pairs
WHERE phoneme_type = 'vowel_long'
  AND dialect_filter = 'uk_only'
  AND target_sounds = '/ɒ/ vs /ɔː/';

INSERT INTO word_pair_dialect_metadata (pair_id, target_dialect, contrast_strength, note)
SELECT id, 'uk_only', 'supported', 'Distinct /ʌ/ vs /ɑː/ contrast for the current UK pilot set.'
FROM word_pairs
WHERE phoneme_type = 'vowel_long'
  AND dialect_filter = 'all'
  AND target_sounds = '/ʌ/ vs /ɑː/';

INSERT INTO word_pair_dialect_metadata (pair_id, target_dialect, contrast_strength, note)
SELECT id, 'au_only', 'supported', 'Non-rhotic /ʌ/ vs /ɑː/ contrast for the current AU pilot set.'
FROM word_pairs
WHERE phoneme_type = 'vowel_long'
  AND dialect_filter = 'all'
  AND target_sounds = '/ʌ/ vs /ɑː/';

INSERT INTO word_pair_dialect_metadata (pair_id, target_dialect, contrast_strength, note)
SELECT id, 'us_only', 'unavailable', 'This family is not in the current US pilot because rhotic American pronunciations reduce the non-rhotic /ʌ/ vs /ɑː/ contrast we teach in UK and AU.'
FROM word_pairs
WHERE phoneme_type = 'vowel_long'
  AND dialect_filter = 'all'
  AND target_sounds = '/ʌ/ vs /ɑː/';

INSERT INTO word_pair_dialect_metadata (pair_id, target_dialect, contrast_strength, note)
SELECT id, 'us_only', 'weak', 'The /ɔ/ side is weakened for many American speakers by the cot-caught merger, so treat this contrast as a weak pilot family.'
FROM word_pairs
WHERE phoneme_type = 'vowel_long'
  AND dialect_filter = 'us_only'
  AND target_sounds = '/oʊ/ vs /ɔ/';

INSERT INTO word_pair_dialect_metadata (pair_id, target_dialect, contrast_strength, note)
SELECT id, 'us_only', 'supported', 'Rhotic /ɑr/ vs /ɔr/ contrast for the current US pilot set.'
FROM word_pairs
WHERE phoneme_type = 'vowel_long'
  AND dialect_filter = 'us_only'
  AND target_sounds = '/ɑr/ vs /ɔr/';

INSERT INTO word_pair_dialect_metadata (pair_id, target_dialect, contrast_strength, note)
SELECT id, 'au_only', 'supported', 'AU pilot contrast set for /e/ vs /æ/ and /ɪə/ vs /eː/.'
FROM word_pairs
WHERE phoneme_type = 'vowel_long'
  AND dialect_filter = 'au_only';

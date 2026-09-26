"""Seed course: Spanish for English speakers.

Each skill lists vocabulary ``(spanish, english, emoji)`` and sentences
``(spanish, english, [other accepted English translations])``. The builder in
``builder.py`` turns these into lessons with a varied mix of exercises.
"""

COURSE = {
    "learning_language": "es",
    "from_language": "en",
    "title": "Spanish",
    "flag": "🇪🇸",
}

UNITS = [
    {
        "title": "Order in a café",
        "description": "Order food and drink",
        "color": "green",
        "guidebook": """## Key phrases
- **Un café, por favor.** — A coffee, please.
- **Quiero pan.** — I want bread.
- **La cuenta, por favor.** — The check, please.
## Tip: nouns have genders
Every Spanish noun is masculine or feminine. Masculine nouns usually take **el** (el café, el pan) and feminine nouns take **la** (la leche, la manzana).
## Tip: politeness
Add **por favor** (please) and **gracias** (thank you) to sound friendly when you order.""",
        "skills": [
            {
                "title": "Café",
                "icon": "cup",
                "words": [
                    ("el café", "the coffee", "☕"),
                    ("el agua", "the water", "💧"),
                    ("la leche", "the milk", "🥛"),
                    ("el té", "the tea", "🍵"),
                    ("el pan", "the bread", "🍞"),
                    ("la manzana", "the apple", "🍎"),
                    ("el jugo", "the juice", "🧃"),
                    ("la galleta", "the cookie", "🍪"),
                ],
                "sentences": [
                    ("Un café, por favor.", "A coffee, please.", ["One coffee, please."]),
                    ("Agua y café.", "Water and coffee.", []),
                    ("El té y la leche.", "The tea and the milk.", []),
                    ("Yo bebo leche.", "I drink milk.", ["I am drinking milk.", "I'm drinking milk."]),
                    ("Quiero pan, por favor.", "I want bread, please.", ["I would like bread, please."]),
                    ("La manzana y el jugo.", "The apple and the juice.", []),
                ],
            },
            {
                "title": "Please & thanks",
                "icon": "chat",
                "words": [
                    ("hola", "hello", "👋"),
                    ("gracias", "thank you", "🙏"),
                    ("sí", "yes", "✅"),
                    ("no", "no", "❌"),
                    ("adiós", "goodbye", "🚪"),
                    ("el menú", "the menu", "📋"),
                    ("la cuenta", "the check", "🧾"),
                    ("el camarero", "the waiter", "🤵"),
                ],
                "sentences": [
                    ("Hola, un té, por favor.", "Hello, a tea, please.", ["Hi, a tea, please.", "Hello, one tea, please."]),
                    ("Gracias, adiós.", "Thank you, goodbye.", ["Thanks, goodbye.", "Thank you, bye."]),
                    ("La cuenta, por favor.", "The check, please.", ["The bill, please."]),
                    ("Sí, gracias.", "Yes, thank you.", ["Yes, thanks."]),
                    ("No, gracias.", "No, thank you.", ["No, thanks."]),
                    ("El menú, por favor.", "The menu, please.", []),
                ],
            },
            {"kind": "chest", "title": "Treasure chest", "icon": "chest"},
            {
                "title": "Food",
                "icon": "food",
                "words": [
                    ("el queso", "the cheese", "🧀"),
                    ("el huevo", "the egg", "🥚"),
                    ("la sopa", "the soup", "🍲"),
                    ("el arroz", "the rice", "🍚"),
                    ("la ensalada", "the salad", "🥗"),
                    ("el pollo", "the chicken", "🍗"),
                    ("la naranja", "the orange", "🍊"),
                    ("el pescado", "the fish", "🐟"),
                ],
                "sentences": [
                    ("Yo como arroz.", "I eat rice.", ["I am eating rice.", "I'm eating rice."]),
                    ("Ella come pollo.", "She eats chicken.", ["She is eating chicken.", "She's eating chicken."]),
                    ("La sopa es buena.", "The soup is good.", []),
                    ("Él come una naranja.", "He eats an orange.", ["He is eating an orange.", "He's eating an orange."]),
                    ("Quiero una ensalada.", "I want a salad.", ["I would like a salad."]),
                    ("El pescado y el arroz.", "The fish and the rice.", []),
                ],
            },
            {
                "title": "Ordering",
                "icon": "bag",
                "words": [
                    ("el sándwich", "the sandwich", "🥪"),
                    ("la pizza", "the pizza", "🍕"),
                    ("la sal", "the salt", "🧂"),
                    ("caliente", "hot", "🔥"),
                    ("frío", "cold", "🧊"),
                    ("el azúcar", "the sugar", "🍬"),
                    ("el helado", "the ice cream", "🍦"),
                    ("la hamburguesa", "the hamburger", "🍔"),
                ],
                "sentences": [
                    ("Quiero un sándwich.", "I want a sandwich.", ["I would like a sandwich."]),
                    ("Tengo una pizza.", "I have a pizza.", []),
                    ("El café está caliente.", "The coffee is hot.", []),
                    ("El agua está fría.", "The water is cold.", []),
                    ("¿Tienes sal?", "Do you have salt?", ["Have you got salt?"]),
                    ("Quiero café con leche.", "I want coffee with milk.", ["I would like coffee with milk."]),
                ],
            },
            {"kind": "review", "title": "Unit review", "icon": "trophy"},
        ],
    },
    {
        "title": "Greet people",
        "description": "Say hello and introduce yourself",
        "color": "purple",
        "guidebook": """## Key phrases
- **Buenos días.** — Good morning.
- **Me llamo Ana.** — My name is Ana.
- **¿De dónde eres?** — Where are you from?
## Tip: upside-down punctuation
Spanish questions start with **¿** and exclamations with **¡**, so you know the tone from the first word.
## Tip: ser vs. estar
Use **ser** (soy, eres, es) for identity and origin, and **estar** (estoy, estás, está) for how someone feels right now.""",
        "skills": [
            {
                "title": "Hello",
                "icon": "wave",
                "words": [
                    ("buenos días", "good morning", "🌞"),
                    ("buenas tardes", "good afternoon", "🌇"),
                    ("buenas noches", "good night", "🌙"),
                    ("amigo", "friend", "🧑‍🤝‍🧑"),
                    ("señor", "sir", "🎩"),
                    ("señora", "madam", "👒"),
                    ("hasta luego", "see you later", "⏰"),
                ],
                "sentences": [
                    ("Buenos días, señor.", "Good morning, sir.", []),
                    ("Buenas noches, amigo.", "Good night, friend.", ["Goodnight, friend."]),
                    ("Hola, ¿qué tal?", "Hello, how are you?", ["Hi, how are you?", "Hello, how is it going?", "Hi, how is it going?"]),
                    ("Hasta luego, señora.", "See you later, madam.", ["See you later, ma'am."]),
                    ("Buenas tardes, amigo.", "Good afternoon, friend.", []),
                    ("Adiós, amiga.", "Goodbye, friend.", ["Bye, friend."]),
                ],
            },
            {
                "title": "Introductions",
                "icon": "person",
                "words": [
                    ("me llamo", "my name is", "🏷️"),
                    ("el nombre", "the name", "📛"),
                    ("mucho gusto", "nice to meet you", "🤝"),
                    ("el estudiante", "the student", "🎒"),
                    ("la profesora", "the teacher", "👩‍🏫"),
                    ("el hombre", "the man", "👨"),
                    ("la mujer", "the woman", "👩"),
                ],
                "sentences": [
                    ("Me llamo Ana.", "My name is Ana.", ["I am called Ana.", "My name's Ana."]),
                    ("Soy estudiante.", "I am a student.", ["I'm a student."]),
                    ("Mucho gusto, Carlos.", "Nice to meet you, Carlos.", ["Pleased to meet you, Carlos."]),
                    ("¿Cómo te llamas?", "What is your name?", ["What's your name?"]),
                    ("Ella es profesora.", "She is a teacher.", ["She's a teacher."]),
                    ("Tú eres mi amigo.", "You are my friend.", ["You're my friend."]),
                ],
            },
            {"kind": "chest", "title": "Treasure chest", "icon": "chest"},
            {
                "title": "Where from",
                "icon": "globe",
                "words": [
                    ("México", "Mexico", "🇲🇽"),
                    ("España", "Spain", "🇪🇸"),
                    ("Colombia", "Colombia", "🇨🇴"),
                    ("la ciudad", "the city", "🏙️"),
                    ("el país", "the country", "🗺️"),
                    ("la playa", "the beach", "🏖️"),
                    ("la montaña", "the mountain", "⛰️"),
                ],
                "sentences": [
                    ("Soy de México.", "I am from Mexico.", ["I'm from Mexico."]),
                    ("¿De dónde eres?", "Where are you from?", []),
                    ("Ella es de España.", "She is from Spain.", ["She's from Spain."]),
                    ("Él es de Colombia.", "He is from Colombia.", ["He's from Colombia."]),
                    ("Es una ciudad grande.", "It is a big city.", ["It's a big city."]),
                    ("Mi país es bonito.", "My country is beautiful.", ["My country is pretty."]),
                ],
            },
            {
                "title": "How are you?",
                "icon": "smile",
                "words": [
                    ("bien", "well", "👍"),
                    ("mal", "bad", "👎"),
                    ("muy", "very", "💯"),
                    ("feliz", "happy", "😄"),
                    ("cansado", "tired", "😴"),
                    ("triste", "sad", "😢"),
                    ("enfermo", "sick", "🤒"),
                ],
                "sentences": [
                    ("Estoy bien, gracias.", "I am well, thank you.",
                     ["I'm well, thank you.", "I am fine, thank you.", "I'm fine, thanks.", "I am good, thank you."]),
                    ("¿Cómo estás?", "How are you?", []),
                    ("Estoy muy cansado.", "I am very tired.", ["I'm very tired."]),
                    ("Ella está feliz.", "She is happy.", ["She's happy."]),
                    ("Él está triste.", "He is sad.", ["He's sad."]),
                    ("Bien, ¿y tú?", "Well, and you?", ["Good, and you?", "Fine, and you?"]),
                ],
            },
            {"kind": "review", "title": "Unit review", "icon": "trophy"},
        ],
    },
    {
        "title": "Talk about family",
        "description": "Describe your family and home",
        "color": "blue",
        "guidebook": """## Key phrases
- **Tengo un hermano.** — I have a brother.
- **Mi madre es alta.** — My mother is tall.
- **El libro está en la mesa.** — The book is on the table.
## Tip: adjectives agree
Adjectives match the noun: **alto** for a man, **alta** for a woman, and they usually come after the noun (la casa **grande**).
## Tip: "mi" is for everything
**Mi** (my) works for masculine and feminine nouns: mi padre, mi madre.""",
        "skills": [
            {
                "title": "Family",
                "icon": "family",
                "words": [
                    ("la madre", "the mother", "👩"),
                    ("el padre", "the father", "👨"),
                    ("el hermano", "the brother", "👦"),
                    ("la hermana", "the sister", "👧"),
                    ("el bebé", "the baby", "👶"),
                    ("la abuela", "the grandmother", "👵"),
                    ("el abuelo", "the grandfather", "👴"),
                ],
                "sentences": [
                    ("Mi madre es alta.", "My mother is tall.", ["My mom is tall."]),
                    ("Tengo un hermano.", "I have a brother.", []),
                    ("Mi padre come pan.", "My father eats bread.", ["My dad eats bread."]),
                    ("El bebé bebe leche.", "The baby drinks milk.", []),
                    ("Mi abuela es simpática.", "My grandmother is nice.", ["My grandma is nice.", "My grandmother is friendly."]),
                    ("Es mi familia.", "It is my family.", ["This is my family.", "It's my family."]),
                ],
            },
            {
                "title": "Pets",
                "icon": "paw",
                "words": [
                    ("el perro", "the dog", "🐕"),
                    ("el gato", "the cat", "🐈"),
                    ("el pájaro", "the bird", "🐦"),
                    ("el caballo", "the horse", "🐴"),
                    ("el ratón", "the mouse", "🐭"),
                    ("grande", "big", "🐘"),
                    ("pequeño", "small", "🐜"),
                ],
                "sentences": [
                    ("Tengo un perro.", "I have a dog.", []),
                    ("El gato es pequeño.", "The cat is small.", ["The cat is little."]),
                    ("Mi hermana tiene un pájaro.", "My sister has a bird.", []),
                    ("El caballo es grande.", "The horse is big.", ["The horse is large."]),
                    ("El perro come mucho.", "The dog eats a lot.", []),
                    ("¿Tienes un gato?", "Do you have a cat?", ["Have you got a cat?"]),
                ],
            },
            {"kind": "chest", "title": "Treasure chest", "icon": "chest"},
            {
                "title": "Home",
                "icon": "house",
                "words": [
                    ("la casa", "the house", "🏠"),
                    ("la cocina", "the kitchen", "🍳"),
                    ("la cama", "the bed", "🛏️"),
                    ("la puerta", "the door", "🚪"),
                    ("la silla", "the chair", "🪑"),
                    ("el libro", "the book", "📖"),
                    ("la ventana", "the window", "🪟"),
                ],
                "sentences": [
                    ("La casa es grande.", "The house is big.", ["The house is large."]),
                    ("El libro está en la mesa.", "The book is on the table.", []),
                    ("Mi madre está en la cocina.", "My mother is in the kitchen.", ["My mom is in the kitchen."]),
                    ("La puerta está abierta.", "The door is open.", []),
                    ("Tengo una cama pequeña.", "I have a small bed.", []),
                    ("El gato está en la silla.", "The cat is on the chair.", []),
                ],
            },
            {
                "title": "Describe",
                "icon": "sparkle",
                "words": [
                    ("alto", "tall", "🦒"),
                    ("joven", "young", "🧒"),
                    ("viejo", "old", "🧓"),
                    ("simpático", "nice", "😊"),
                    ("inteligente", "intelligent", "🧠"),
                    ("bonito", "pretty", "🌸"),
                    ("rápido", "fast", "🏎️"),
                ],
                "sentences": [
                    ("Mi hermano es alto.", "My brother is tall.", []),
                    ("El abuelo es viejo.", "The grandfather is old.", ["Grandpa is old.", "The grandpa is old."]),
                    ("Ella es muy inteligente.", "She is very intelligent.", ["She's very intelligent.", "She is very smart."]),
                    ("El perro es rápido.", "The dog is fast.", ["The dog is quick."]),
                    ("Mi amiga es simpática.", "My friend is nice.", ["My friend is friendly."]),
                    ("La casa es bonita.", "The house is pretty.", ["The house is beautiful."]),
                ],
            },
            {"kind": "review", "title": "Unit review", "icon": "trophy"},
        ],
    },
]

ACHIEVEMENTS = [
    ("wildfire", "Wildfire", "Reach a {n} day streak", "flame", "orange", "streak", [3, 7, 14, 30, 50, 100]),
    ("sage", "Sage", "Earn {n} XP", "bolt", "green", "total_xp", [100, 250, 500, 1000, 2000, 5000]),
    ("scholar", "Scholar", "Complete {n} lessons", "book", "blue", "lessons_completed", [5, 10, 25, 50, 100]),
    ("sharpshooter", "Sharpshooter", "Complete {n} lessons with no mistakes", "target", "red",
     "perfect_lessons", [1, 5, 10, 25, 50]),
    ("conqueror", "Conqueror", "Complete {n} skills", "crown", "purple", "skills_completed", [1, 3, 6, 9, 12]),
    ("champion", "Champion", "Complete {n} units", "trophy", "yellow", "units_completed", [1, 2, 3]),
    ("legendary", "Legendary", "Reach Legendary in {n} skills", "legendary", "gold", "legendary_skills", [1, 3, 6]),
    ("overachiever", "Overachiever", "Reach your daily goal {n} times", "goal", "teal", "daily_goals_met",
     [1, 7, 30, 100]),
]

RIVALS = [
    ("maria_g", "María G.", "pink", 55),
    ("kenji", "Kenji", "blue", 45),
    ("priya", "Priya", "purple", 40),
    ("lucas_b", "Lucas", "orange", 35),
    ("sofia", "Sofía", "red", 30),
    ("oliver", "Oliver", "green", 30),
    ("amara", "Amara", "yellow", 25),
    ("diego", "Diego", "teal", 25),
    ("hannah", "Hannah", "pink", 20),
    ("mateo", "Mateo", "blue", 20),
    ("chloe", "Chloe", "purple", 15),
    ("ravi", "Ravi", "orange", 15),
    ("emma", "Emma", "green", 10),
    ("noah", "Noah", "red", 10),
]

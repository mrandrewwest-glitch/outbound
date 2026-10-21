// All the jokes live here. Pools are {clean:[...], edgy:[...]}; edgy lines are only
// mixed in when Spicy mode is on.

export const PRODUCTS = [
  'Gutter Insurance™', 'Premium Solar Panels', 'Fibre Internet (it is just a cable)', 'Extended Warranty for a car you don\'t own',
  'Energy Plan Plus', 'Smart Water Filters', 'Business Phone Bundles', 'Pet Insurance for Goldfish', 'Prepaid Funeral Plans',
  'Subscription Socks', 'Cloud Storage for Your Cloud Storage',
];

export const FIRST = ['Gary', 'Linda', 'Ron', 'Tina', 'Albert', 'Maureen', 'Harry', 'Sheila', 'Bruce', 'Karen', 'Trevor', 'Doreen', 'Barry', 'Fiona', 'Colin', 'Jan'];
export const LAST = ['Thompson', 'Nguyen', 'Papadopoulos', 'McAllister', 'Singh', 'O\'Brien', 'Kowalski', 'Wright', 'Fitzgerald', 'Bianchi', 'Hargreaves', 'Dlamini'];

// Things the player can say, by tag. Each call picks 3 random tags and one line per tag.
export const PLAYER = {
  script: {
    clean: ['Thanks for taking my call! Do you have a minute to save some money today?', 'I\'m calling about an exclusive offer tailored just for you.', 'As per my script: this is a limited-time deal. *reads the next line*'],
    edgy: ['Per the script I\'m legally required to say the next bit with enthusiasm. WOO.'],
  },
  empathy: {
    clean: ['I totally hear you. That sounds really tough.', 'Sorry to hear that! How can I make your day easier?', 'Absolutely, your time matters. I\'ll keep it short.'],
    edgy: ['Yeah mate, life\'s a bastard sometimes. I get it.'],
  },
  hard: {
    clean: ['This deal ends in ten minutes. Are you in or out?', 'Let\'s lock it in right now. Got your card handy?', 'Most people say yes right here. Shall I put you down?'],
    edgy: ['Right, I\'m not hanging up until we have a yes. I\'ve got nowhere to be. I\'m in HELL.'],
  },
  joke: {
    clean: ['Why did the salesman cross the road? To close a deal on the other side!', 'I promise I\'m only 30% robot.', 'I\'m contractually obliged to sound this cheerful.'],
    edgy: ['Between you and me I\'d rather be at the pub than here too.', 'My boss is a muppet, but the deal\'s genuinely decent.'],
  },
  honest: {
    clean: ['Honestly? It\'s a good deal, but only if you actually need it.', 'I won\'t hard-sell you. Here are the real pros and cons.', 'I get paid commission, but this one is genuinely decent.'],
    edgy: ['Look, I\'m on minimum wage and a dream. But this deal is actually good.'],
  },
  wild: {
    clean: ['Off-script: have you ever considered becoming my business partner?', '*sings the product features to the tune of Happy Birthday*', 'I\'ll level with you: I\'ve got a goat on my desk and I\'m not sure why.'],
    edgy: ['Say yes and I\'ll bring it round personally and pour you a drink.', 'Please say yes, my boss is standing right behind me with his arms crossed.', '*whispers* I\'m not even supposed to be on this call, I\'m watching YouTube.'],
  },
};

// Customer archetypes. w = how much each tag lands with them (-2..2). base = starting interest.
export const ARCH = {
  chatter: {
    name: 'Friendly Chatterbox', emoji: '😄', base: 46,
    w: { empathy: 2, joke: 2, script: -1, hard: -1, honest: 1, wild: 1 },
    open: { clean: ['Hellooo! Oh how lovely, a phone call! I was just doing the crossword. Who\'s this?', 'Oh hi love! Hang on, let me turn the telly down... right, go!'], edgy: ['G\'day! Sorry, I\'m halfway through a bottle of shiraz. Whaddya got for me?'] },
    follow: { clean: ['Anyway, my sister had one of those, did I tell you about my sister?', 'What does it cost, though? Do you like cats?'], edgy: ['Anyway my ex had one of those. Absolute dickhead. Is this one reliable?'] },
    good: { clean: ['Ha! You\'re a hoot!', 'Oh, you really get me!'], edgy: ['Ha! You\'re a bloody legend!'] },
    bad: { clean: ['Oh. Right. Well.', 'Hmm, that was a bit cold, dear.'], edgy: ['Wow. Charming. Real charming.'] },
    yes: { clean: ['Go on then, sign me up! And tell your mum I said hi.'], edgy: ['Bugger it, go on. I\'m in. Now what\'s your star sign?'] },
    no: { clean: ['I\'ll have a think, love. Lovely chat though!'], edgy: ['Nah. But you\'ve got a lovely voice. Bye!'] },
  },
  gate: {
    name: 'Gatekeeper Linda', emoji: '🛡️', base: 38,
    w: { script: 2, honest: 1, empathy: 0, hard: -2, joke: -1, wild: -2 },
    open: { clean: ['Accounts, Linda speaking. Mr Whitaker is in a meeting. He\'s always in a meeting.', 'You\'ve reached reception. What is this regarding? Be specific.'], edgy: ['Reception. If you\'re selling something I\'ll hang up and enjoy it.'] },
    follow: { clean: ['And how did you get this number?', 'Is this a sales call? You can tell me.'], edgy: ['Right, so you\'re a cold-caller. Sounds like a bloody horrible job.'] },
    good: { clean: ['Well, at least you\'re polite.', 'Mm. Go on.'], edgy: ['Okay, you\'re not a total tosser. Go on.'] },
    bad: { clean: ['I\'m going to stop you there.', 'That\'s highly unprofessional.'], edgy: ['Hello? Don\'t get cute with me, sunshine.'] },
    yes: { clean: ['Fine. I\'ll put you through. He\'ll sign. He signs everything.'], edgy: ['Fine. Mr Whitaker never reads anything anyway, he\'ll sign.'] },
    no: { clean: ['Mr Whitaker is not interested. Don\'t call back.'], edgy: ['Not interested. Lose this number, mate.'] },
  },
  angry: {
    name: 'Angry Ron', emoji: '😡', base: 28,
    w: { empathy: 2, honest: 1, script: -1, hard: -2, joke: -2, wild: 0 },
    open: { clean: ['WHAT?! I\'m trying to watch the cricket!', 'This is the FOURTH call today! Take me off your list!'], edgy: ['WHAT?! I\'m trying to watch the bloody cricket!', 'Not another one of you pricks. I\'ve got the Do Not Call register!'] },
    follow: { clean: ['And why should I give a hoot about that?', 'Is any of this actually going to save me money, or is it nonsense?'], edgy: ['Yeah yeah, and why would I give a stuff?'] },
    good: { clean: ['...Well. That\'s fair enough.', 'Huh. Didn\'t expect you to be reasonable.'], edgy: ['...Alright. That\'s actually fair.'] },
    bad: { clean: ['Don\'t talk to me like that!', 'OH, GIVE IT A REST!'], edgy: ['Don\'t talk to me like I\'m an idiot, you muppet!', 'Get stuffed!'] },
    yes: { clean: ['Fine! Send me the form! And stop calling me!'], edgy: ['Bloody hell, FINE. Send me the form. And never call again!'] },
    no: { clean: ['I\'m reporting you!'], edgy: ['Go jump, mate. Reported!'] },
  },
  breather: {
    name: 'Silent Breather', emoji: '😶', base: 42,
    w: { script: 1, empathy: 1, honest: 1, joke: 0, hard: -1, wild: 1 },
    open: { clean: ['...', '*breathing*', '...is this the shop?'], edgy: ['...*heavy breathing*...', '...do you know who this is?'] },
    follow: { clean: ['...', '*sound of a chair creaking*', '...hmm.'], edgy: ['*wheeze*... go on....'] },
    good: { clean: ['...mm.', '*approving breathing*'], edgy: ['*approving wheezing*'] },
    bad: { clean: ['*click... pause... breathing resumes*', '...no.'], edgy: ['*breathing intensifies*'] },
    yes: { clean: ['...yes.'], edgy: ['...okay. Put it on the card.'] },
    no: { clean: ['*click*'], edgy: ['*click*'] },
  },
  cryer: {
    name: 'Tearful Tina', emoji: '😭', base: 36,
    w: { empathy: 2, honest: 2, script: -2, hard: -2, joke: -1, wild: -1 },
    open: { clean: ['*sniff* Hello? I\'m sorry, it\'s been a day...', 'Oh... hi. My cat just... *sob* ...never mind.'], edgy: ['*sniff* Hello? My husband just left me for my yoga instructor...'] },
    follow: { clean: ['It\'s just so hard being on my own, you know?', 'Do you ever just... feel like nothing matters?'], edgy: ['And he took the dog. And the Netflix account.'] },
    good: { clean: ['*sniff* You\'re so kind.', 'Thank you for listening.'], edgy: ['*sniff* You\'re the nicest person I\'ve spoken to all week.'] },
    bad: { clean: ['*bursts into tears*', 'Why is everyone so mean to me?!'], edgy: ['*wails*'] },
    yes: { clean: ['Okay. Yes. I deserve nice things.'], edgy: ['Yes. I\'m treating myself. Screw him.'] },
    no: { clean: ['I\'m sorry, I can\'t. Thank you for being kind.'], edgy: ['Sorry. I need to go cry in the shower now.'] },
  },
  haggler: {
    name: 'Haggling Harry', emoji: '🤑', base: 44,
    w: { hard: 2, honest: 1, joke: 0, script: 0, empathy: -1, wild: 0 },
    open: { clean: ['Whatever it is, I want it half price.', 'Go on, what\'s the best you can do? And don\'t say "the price is the price".'], edgy: ['Whatever you\'re flogging, I want it half price. And a free kebab.'] },
    follow: { clean: ['My neighbour got it cheaper. What are you going to do about that?', 'Throw in something free and we\'ll talk.'], edgy: ['Your competition said they\'d do it for a handshake and a slab of VB.'] },
    good: { clean: ['Now THAT is a salesman.', 'I like your style.'], edgy: ['Now THAT is a salesman. Bloody hell.'] },
    bad: { clean: ['That\'s a rip-off.', 'You\'re going soft on me.'], edgy: ['You\'re going soft, sweetheart.'] },
    yes: { clean: ['Deal! Pleasure doing business.'], edgy: ['Deal! Now piss off, I\'ve got another deal to haggle.'] },
    no: { clean: ['Too rich for me. Ring me when you\'re serious.'], edgy: ['Too rich. Ring me when you grow a pair.'] },
  },
  grandpa: {
    name: 'Confused Albert', emoji: '👴', base: 44,
    w: { empathy: 2, honest: 1, script: 0, hard: -2, joke: 1, wild: 0 },
    open: { clean: ['Is that you, Kevin? Speak up!', 'Hello? I can\'t find my glasses. Who is this?'], edgy: ['Is that you, Kevin? You still owe me forty quid!'] },
    follow: { clean: ['What was that? You\'re breaking up! Is this the bank?', 'In my day we just wrote a letter, you know.'], edgy: ['In my day a man could drink at lunch and nobody said a thing.'] },
    good: { clean: ['What a lovely young person.', 'Yes yes, you\'re a good boy.'], edgy: ['What a polite young man. Not like the other tossers.'] },
    bad: { clean: ['Speak up, I can\'t hear you!', 'WHAT? I can\'t find my teeth!'], edgy: ['WHAT? Stop shouting, you cheeky bugger!'] },
    yes: { clean: ['Yes, put it on my daughter\'s card!'], edgy: ['Yes, put it on my daughter\'s card, she owes me!'] },
    no: { clean: ['I think you have the wrong Albert, dear.'], edgy: ['I\'ll ask Doreen. She\'s dead, but I\'ll ask her.'] },
  },
  secret: {
    name: 'Mystery Shopper', emoji: '🕵️', base: 50,
    w: { script: 2, honest: 2, empathy: 1, joke: 0, hard: -1, wild: -2 },
    open: { clean: ['Hi! I\'m just looking for some information about your products. *scribbles*', 'Good afternoon. I have a few questions about your service.'], edgy: ['Hi there. *scribbles* ...Hypothetically, are you ever not a total snake?'] },
    follow: { clean: ['And what are your terms and conditions?', 'Can you tell me about your cancellation process?'], edgy: ['And how many times have you been warned this month?'] },
    good: { clean: ['*scribbles approvingly*', 'Excellent, very thorough.'], edgy: ['*scribbles* Noted, you\'re not a donkey.'] },
    bad: { clean: ['*scribbles furiously*', 'I see. Noted.'], edgy: ['*scribbles* Oh, that is going in the report.'] },
    yes: { clean: ['Wonderful. I\'ll rate you highly. Please enjoy your bonus.'], edgy: ['Wonderful. Five stars. I\'ll tell your boss you\'re not a muppet.'] },
    no: { clean: ['Thank you. I\'ll be sharing my notes with your manager.'], edgy: ['Thanks. Your manager is going to love this.'] },
  },
  dream: {
    name: 'DREAM CUSTOMER', emoji: '🌟', base: 80, rare: true,
    w: { script: 1, empathy: 1, honest: 1, joke: 1, hard: 1, wild: 0 },
    open: { clean: ['Hi! I\'ve been looking for exactly this! Where do I sign?!', 'Perfect timing! I was literally about to ring you.'], edgy: ['Finally, someone competent! I\'ve got money and zero patience for crap!'] },
    follow: { clean: ['Is there anything else I can add to my order?', 'Do you take credit cards? Of course you do.'], edgy: ['Anything else? I\'ve just won big on the horses!'] },
    good: { clean: ['Fantastic!', 'You\'re the best!'], edgy: ['Bloody brilliant!'] },
    bad: { clean: ['Hmm, well, whatever. Still keen!'], edgy: ['Ha, whatever, still keen!'] },
    yes: { clean: ['SOLD! Triple the order!'], edgy: ['SOLD! Triple the order! Drinks on me!'] },
    no: { clean: ['Oh no, the line dropped. Ring me back?'], edgy: ['Oh no, the line dropped. Bloody Telstra.'] },
  },
  // ---- Spicy mode only ----
  drunk: {
    name: 'Drunk Barry', emoji: '🥴', base: 46, edgyOnly: true,
    w: { joke: 2, empathy: 1, wild: 2, honest: 0, script: -2, hard: -1 },
    open: { clean: ['Shhhh.. hello?'], edgy: ['*hic* G\'day... who dis? It\'s two in the afternoon on a Tuesday!', 'Sorry mate, I\'m at the pub. What are ya sellin\'? I\'ll buy ten.'] },
    follow: { clean: ['...'], edgy: ['Hang on, I\'ve gotta take a leak. No don\'t hang up, I love you.', 'Do you wanna hear about my divorce?'] },
    good: { clean: ['...'], edgy: ['HA! I fuckin\' love you, mate!', 'You\'re a good egg. A top bloke.'] },
    bad: { clean: ['...'], edgy: ['Nah mate, you\'re harshing my buzz.', '*burps into the phone*'] },
    yes: { clean: ['...'], edgy: ['Whatever, put it on the card. Next round\'s on me!'] },
    no: { clean: ['...'], edgy: ['Nup. Gonna go have a spew. Cheers!'] },
  },
  flirt: {
    name: 'Flirty Fiona', emoji: '😏', base: 48, edgyOnly: true,
    w: { joke: 2, wild: 1, honest: 1, empathy: 0, script: -1, hard: 1 },
    open: { clean: ['Hi.'], edgy: ['Ooh, hello. Nice voice. Do you always sound this dreamy at work?', 'Well well well. Are you single, or is that one of the screening questions?'] },
    follow: { clean: ['...'], edgy: ['So tell me more about... the "product". *giggles*', 'You can keep talking. I\'m not listening to the words but I like the tone.'] },
    good: { clean: ['...'], edgy: ['Mmm. Keep going.', 'Cheeky. I like it.'] },
    bad: { clean: ['...'], edgy: ['Oh. Boring. Do you have a manager I can flirt with instead?'] },
    yes: { clean: ['...'], edgy: ['Fine, you\'ve charmed me. Sign me up. And call me after your shift.'] },
    no: { clean: ['...'], edgy: ['Nope. Thanks for the entertainment, though. Bye, handsome.'] },
  },
};

export const SILENCE = {
  clean: ['Hello? Are you still there?', 'Did I lose you?', 'Is anyone there?'],
  edgy: ['Oi, you fall asleep or what?', 'Hello? Hellooo? Bloody useless.'],
};

export const WRONG_NUMBER = {
  clean: ['Wrong number, sorry!', 'No answer. It rang out.'],
  edgy: ['*goes straight to voicemail: "This is Gary. Leave a message or don\'t, I don\'t give a toss."*'],
};

// What the boss yells when you're busted.
export const BOSS_YELL = {
  clean: [
    'Is this what I pay you for?!',
    'Is that... a cat video?! GET BACK TO WORK!',
    'I\'m writing this one down. Back on the phones!',
    'We have a QUOTA! Why are you not CALLING?!',
    'I can see your screen from here, you know!',
  ],
  edgy: [
    'What the HELL are you doing?!',
    'I\'m not paying you to sit on your arse watching crap!',
    'Bloody hell! Get back on the damn phones!',
    'You\'re a bloody disgrace to this team!',
    'Stop pissing about and SELL SOMETHING!',
  ],
};

export const BIG_BOSS_YELL = {
  clean: ['The BIG BOSS saw you. Pack your desk. Just kidding. Warning.'],
  edgy: ['The BIG BOSS saw you, mate. Absolute shambles.'],
};

export const COWORKER_SAY = {
  clean: [
    'Anyone seen my stapler?', 'Why is the coffee machine always broken?', 'I swear that guy is stalking us.', 'Does anyone know what day it is?',
    'My headset smells like sadness.', 'I need a holiday.', 'Is it 5 yet?', 'Who stole my yoghurt?!', 'Another gutter insurance sale. Woo.',
    'I hate Mondays. It\'s Thursday.', 'Quick, look busy!',
  ],
  edgy: [
    'I\'d sell my kidney to leave this place.', 'Who the f*** microwaved fish AGAIN?!', 'If I hear "per my last email" again I\'ll scream.',
    'I need a drink. And a better life.', 'Karen from HR is such a snake.', 'My boss is a prick.', 'I\'m so hungover I can taste my own liver.',
    'I swear the boss can smell fun.', 'Anyone wanna ditch and go to the pub?',
  ],
};

export const COWORKER_HIT = {
  clean: ['Hey!', 'Ouch!', 'Seriously?!', 'I\'m telling Greg!', 'Real mature.', 'Watch it!'],
  edgy: ['You absolute muppet!', 'OW! You prick!', 'Seriously, f*** off!', 'I\'ll get you back for that, arse.'],
};

export const COWORKER_NICE = {
  clean: ['Careful, boss is coming.', 'Shh, he\'s coming!'],
  edgy: ['Psst — the boss is coming, dickhead.', 'Heads up, the prick is coming.'],
};

export const GOSSIP = {
  clean: [
    '☕ Cooler gossip: Greg bought a boat and told nobody.',
    '☕ Cooler gossip: apparently the CRM is run by one intern.',
    '☕ Cooler gossip: accounts are getting a fancy new fridge.',
    '☕ Cooler gossip: Linda from reception has a podcast.',
  ],
  edgy: [
    '☕ Cooler gossip: Greg and Karen from HR... in the stationery cupboard. Again.',
    '☕ Cooler gossip: someone lied about their sick day. Photos are on Instagram.',
    '☕ Cooler gossip: the Christmas party budget was spent on Greg\'s divorce lawyer.',
  ],
};

export const DRINKS = {
  clean: ['🥤 You sneak a sip of an energy drink. Zing!', '🍫 You inhale a chocolate bar. Sugar rush!', '🥜 Snack drawer raided!'],
  edgy: ['🥃 You take a swig from the "water bottle". It is not water.', '🍺 A warm tinnie from the bottom drawer. Don\'t tell HR.', '🥃 Medicinal. Strictly medicinal.'],
};

/* The deck: every chapter, waypoint and slide lives here as plain data. Edit this file to change the talk.
   The engine (engine.js) derives all navigation from it, so you can add, remove or reorder chapters and
   slides without touching any other code.

   status
     'verified'  copy and photos taken straight from shaneparreco.com (captions are the site's own captions)
     'draft'     placeholder or provisional wording. It shows a small DRAFT tag on screen (press D to hide tags).

   Chapter node
     x, z   where the waypoint stands on the mountain (the homepage's seven lights are not used)
     kind   'lamp' (warm, places things get made) or 'beacon' (cool, places he goes)
     az, el, dist   camera angle, height and distance for this chapter (optional)
     anchor   where the waypoint sits across the screen, 0 = left edge, 1 = right edge (optional)

   Slide types: title, full, split, quote, timeline, closing
   Photos: image { src, alt, caption } or image { placeholder: 'what photo goes here' } for a clearly marked empty slot. */
window.DECK = {
  id: 'winding-road',
  title: 'The Winding Road',
  subtitle: 'Building a Career, a Company, and a Life Around Curiosity',
  event: 'A-B Tech, Asheville',
  date: 'November 16, 2026',

  chapters: [
    {
      id: 'opening', title: 'The winding road', short: 'Opening', kind: 'beacon',
      node: { x: -24, z: -12, az: -10, el: 16, dist: 54, anchor: 0.72 },
      slides: [
        { id: 'title', type: 'title', status: 'draft',
          eyebrow: 'A-B Tech · November 16, 2026',
          title: 'The Winding Road',
          body: 'Building a career, a company, and a life around curiosity',
          byline: 'Shane Parreco',
          notes: 'Working title from the planning thread. Confirm or change.' },
        { id: 'path', type: 'full', status: 'draft',
          image: { src: '/assets/img/grow-card.jpg', alt: 'Evening light over the Blue Ridge ridgelines', caption: 'The Blue Ridge, home' },
          title: 'Not a straight line',
          notes: 'Opening beat. Headline is placeholder copy.' }
      ]
    },
    {
      id: 'building', title: 'Learning to build', short: 'Building', kind: 'lamp',
      node: { x: 30, z: -34, az: 12, el: 16, dist: 52, anchor: 0.3 },
      slides: [
        { id: 'carpenter', type: 'split', status: 'verified',
          eyebrow: 'Chapter 1',
          title: 'Learning to build',
          body: ['Twenty years as a carpenter.', 'Trades, customers, craftsmanship.'],
          image: { src: '/assets/img/build-dunlap.jpg', alt: 'A timber house in Dunlap with a newly built wraparound porch, railing and stone foundation',
                   caption: 'The house in Dunlap, porch framed and railed' },
          notes: 'Photo and caption are from the Build page of the site. Add Shane\'s own story points.' },
        { id: 'lark', type: 'full', status: 'verified',
          image: { src: '/assets/img/build-camper.jpg', alt: 'A rebuilt vintage Lark camper, white panels and aluminum trim, parked outside', caption: 'The Lark, back together' },
          title: 'Finishing what you start' ,
          notes: 'Headline is placeholder copy. Photo caption is from the site.' },
        { id: 'building-story', type: 'split', status: 'draft',
          eyebrow: 'Chapter 1',
          title: 'What the trade taught me',
          body: ['[Shane to add: two or three real lessons from the trades.]'],
          image: { placeholder: 'A job-site or workshop photo' } }
      ]
    },
    {
      id: 'curiosity', title: 'Following curiosity', short: 'Curiosity', kind: 'beacon',
      node: { x: -34, z: -56, az: -14, el: 16, dist: 54, anchor: 0.7 },
      slides: [
        { id: 'music', type: 'full', status: 'verified',
          image: { src: '/assets/img/play-band.jpg', alt: 'Shane on drums with a guitarist and a bassist playing outside a brewery',
                   caption: 'High Flying Criminals, photograph by Ken Voltz' },
          title: 'Music',
          notes: 'Photo credit: Ken Voltz. Keep the credit on screen.' },
        { id: 'flying', type: 'full', status: 'verified',
          image: { src: '/assets/img/fly-sunset.jpg', alt: 'A paraglider flying at sunset under orange cloud, other pilots and wings on the ground below', caption: 'Evening flight' },
          title: 'Flying' },
        { id: 'curiosity-story', type: 'split', status: 'draft',
          eyebrow: 'Chapter 2',
          title: 'Following curiosity',
          body: ['[Shane to add: teaching, relationships, how curiosity led somewhere.]'],
          image: { placeholder: 'A teaching or people photo' } }
      ]
    },
    {
      id: 'turning', title: 'Turning points', short: 'Turning points', kind: 'lamp',
      node: { x: 22, z: -78, az: 10, el: 16, dist: 56, anchor: 0.3 },
      slides: [
        { id: 'turning-point', type: 'quote', status: 'draft',
          eyebrow: 'Chapter 3',
          title: 'A non-linear life',
          body: '[Shane decides what belongs here, in his own words. This chapter can be folded into a neighbor or cut.]',
          notes: 'Deliberately empty. No details are filled in on purpose.' }
      ]
    },
    {
      id: 'entrepreneur', title: 'Becoming an entrepreneur', short: 'Entrepreneur', kind: 'beacon',
      node: { x: -20, z: -100, az: -12, el: 16, dist: 56, anchor: 0.7 },
      slides: [
        { id: 'otc', type: 'timeline', status: 'verified',
          eyebrow: 'Chapter 4',
          title: 'From the trade to software',
          items: [
            { when: '20 years', what: 'Carpentry' },
            { when: '2019', what: 'Online Training Concepts' },
            { when: '2023', what: 'Aktiga' }
          ],
          notes: 'Dates are from the Work page of the site.' },
        { id: 'stage', type: 'split', status: 'verified',
          eyebrow: 'Chapter 4',
          title: 'Pitching Agenda Keeper',
          body: ['A PDF syllabus became an online learning platform.', 'That became Online Training Concepts.'],
          image: { src: '/assets/img/work-stage.jpg', alt: 'Shane presenting Agenda Keeper on stage at Venture Connect, a slide reading The Problem behind him',
                   caption: 'Pitching Agenda Keeper at Venture Connect' },
          notes: 'Wording and photo caption are from the Work page of the site.' },
        { id: 'entrepreneur-story', type: 'split', status: 'draft',
          eyebrow: 'Chapter 4',
          title: 'What I did not know',
          body: ['[Shane to add: first customers, first mistakes, e-learning and software.]'],
          image: { placeholder: 'An early product or customer photo' } }
      ]
    },
    {
      id: 'aktiga', title: 'Building Aktiga', short: 'Aktiga', kind: 'lamp',
      node: { x: 42, z: -118, az: 12, el: 16, dist: 58, anchor: 0.3 },
      slides: [
        { id: 'aktiga-office', type: 'split', status: 'verified',
          eyebrow: 'Chapter 5',
          title: 'Building Aktiga',
          body: ['Founded in 2023.', 'A team, clients, and a culture to look after.'],
          image: { src: '/assets/img/work-card.jpg', alt: 'The Aktiga office, a circular slatted wall sculpture beside an open workspace' },
          notes: 'Founding year is from the Work page. The rest is placeholder.' },
        { id: 'aktiga-team', type: 'split', status: 'draft',
          eyebrow: 'Chapter 5',
          title: 'Team, clients, culture',
          body: ['[Shane to add: how the team works, who the clients are, real operating lessons.]'],
          image: { placeholder: 'A team or client-work photo' } },
        { id: 'agenda-keeper', type: 'split', status: 'draft',
          eyebrow: 'Chapter 5',
          title: 'Agenda Keeper',
          body: ['[Shane to add: what it is, what building it taught the team.]'],
          image: { placeholder: 'An Agenda Keeper screenshot' } },
        { id: 'ops-lesson', type: 'quote', status: 'draft',
          eyebrow: 'Chapter 5',
          title: 'An operating lesson',
          body: '[Shane to add one real lesson, in his words.]' }
      ]
    },
    {
      id: 'learned', title: 'What I have learned, and what comes next', short: 'What I learned', kind: 'beacon',
      node: { x: -6, z: -142, az: -10, el: 16, dist: 60, anchor: 0.7 },
      slides: [
        { id: 'lessons', type: 'quote', status: 'draft',
          eyebrow: 'Chapter 6',
          title: 'What I have learned',
          body: '[Shane to add: the two or three things he most wants students to carry out of the room.]' },
        { id: 'next', type: 'full', status: 'draft',
          image: { src: '/assets/img/fly-ridge.jpg', alt: 'Three paragliders in a wide evening sky over a ridge' },
          title: 'What comes next',
          notes: 'Headline is placeholder copy.' }
      ]
    },
    {
      id: 'fireside', title: 'Fireside chat', short: 'Fireside', kind: 'lamp',
      node: { x: 26, z: -158, az: 12, el: 16, dist: 62, anchor: 0.3 },
      slides: [
        { id: 'questions', type: 'split', status: 'draft',
          eyebrow: 'Fireside chat',
          title: 'Questions to get us started',
          body: ['How did you decide to leave a trade you were good at?', 'What would you do differently?', 'What should we be learning right now?'],
          image: { src: '/assets/img/wp-notebook.jpg', alt: 'A quiet beach under a wide cloudy sky' },
          notes: 'Suggested prompts only. Replace with Shane\'s own.' },
        { id: 'close', type: 'closing', status: 'draft',
          eyebrow: 'Thank you',
          title: 'Thank you',
          body: 'shaneparreco.com',
          notes: 'Add resources or a contact line if wanted.' }
      ]
    }
  ]
};

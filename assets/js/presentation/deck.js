/* The deck: every chapter, waypoint and slide lives here as plain data. Edit this file to change the talk.
   The engine (engine.js) derives all navigation from it, so chapters and slides can be added, removed or
   reordered without touching any other code.

   Source of truth for the story: "The Winding Road: content production brief" in the Common Ground project
   "Shane - Personal Presentation" (presentation/winding-road-detailed-slide-outline.md). Facts come from
   Shane's own spoken interview. The full, private speaker notes stay in that file, NOT here: this repository
   is public and so is the page source, so notes below are the shareable version (no relatives' names, no
   family conflict, no sentencing or financial detail, no client or prospect names).

   Slide fields
     type      title | split | full | quote | timeline | closing | final
             final = the last slide: one huge line, plus a small sign-off with the three web addresses (urls)
               split = words with a photo under them, full = same with a larger frame. All photos stay contained.
               (Legacy type name: 'full' never means a full-screen photo.)
               Panels always sit on the side AWAY from the glowing waypoint, so the mountain stays visible.
     eyebrow   small label above the title (optional)
     title     the headline (one key idea per slide)
     body      one to three short lines (string or array). Anything longer belongs in notes.
     items     timeline only: [{ when, what }, ...]
     image     { src, alt, caption, ratio, pos }  a site photo or a new one. ratio (e.g. '4 / 3') and pos (CSS object-position)
             choose the frame crop. Photos are always contained frames, never full screen. Add a caption only for facts
             we know: no places, dates or credits are guessed.
               { wanted: 'description' }  no photo yet: the slide runs text-only over the mountain and a
               "PHOTO WANTED" tag shows in review mode (press D)
     editorial true when the on-screen words are editorial copy, NOT a verbatim quote from Shane. Quote slides
               never show quotation marks, so editorial lines are never presented as spoken quotes.
     status    'verified' = facts and wording come from Shane's interview or from shaneparreco.com
               'draft'    = provisional. Shows a DRAFT tag in review mode.
     quotes    split only: [{ text, who, portrait }] short sourced quotes (2.3)
   notes     speaker notes (press N). Shareable version only, see above.

   Chapter fields
     minutes   rough speaking time, shown with the notes (the chapters add up to 60)
     node      x, z  where the waypoint stands on the mountain (the homepage's seven lights are not used)
               az, el, dist  camera angle, height and distance (optional)
               anchor  where the waypoint sits across the screen, 0 = left, 1 = right (optional)
     kind      'lamp' (warm) or 'beacon' (cool) waypoint color

   Review mode (press D, or add ?review=1 to the address) shows DRAFT and PHOTO WANTED tags. They are hidden
   by default so nothing unfinished-looking can appear on the projector. */
window.DECK = {
  id: 'winding-road',
  title: 'The Winding Road',
  subtitle: 'Building a Career, a Company, and a Life Around Curiosity',
  event: 'A-B Tech, Asheville',
  date: 'November 16, 2026',

  chapters: [
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'roots', title: 'Born Into a Business', short: 'Roots', kind: 'beacon', minutes: 7,
      node: { x: -24, z: -12, az: -10, el: 16, dist: 54, anchor: 0.72 },
      slides: [
        { id: 'deck-title', type: 'title', status: 'verified',
          eyebrow: 'A-B Tech, Asheville · November 16, 2026',
          title: 'The Winding Road',
          body: 'Building a Career, a Company, and a Life Around Curiosity',
          byline: 'Shane Parreco',
          image: { wanted: 'None. The title page is text over the mountain.' },
          notes: 'Opening title page. Welcome, then one line on what this hour is: a winding path, told one waypoint at a time. Roughly 60 minutes, with a separate fireside conversation afterward.' },
        { id: 'roots-title', type: 'split', status: 'verified',
          eyebrow: 'Roots',
          title: 'Born Into a Business',
          body: 'A family business. A childhood on job sites.',
          image: { src: '/assets/img/wr-baby.jpg', alt: 'A laughing baby in a pink outfit sitting beside a stuffed rabbit', ratio: '4 / 3', pos: 'center 30%' },
          notes: 'Three generations in construction and stone work: an immigrant Italian stonemason, then a Maryland construction company outside DC led by Shane\'s grandfather, father and uncle. Childhood weekends and summers on job sites: fuel trucks, machinery, foremen, hands-on work. The baby photo is a cameo, not a photo of the business.' },
        { id: 'roots-yours', type: 'split', status: 'verified',
          eyebrow: 'Roots',
          title: 'Good at It Doesn\'t Mean It\'s Yours',
          body: ['Arnold Parreco & Sons.', 'I knew the work. I didn\'t want that workplace.'],
          image: { src: '/assets/img/wr-old-jobsite.jpg', alt: 'A person standing beside a large yellow Caterpillar 631E earthmover on a dirt jobsite', ratio: '2 / 1', pos: 'center',
                   caption: 'An old jobsite' },
          notes: 'The family company is Arnold Parreco & Sons (name approved by Shane). Shane felt dismissed as the youngest. In 2002 his father asked him to stay; he declined and chose school. The company shrank sharply later, which is separate from the 2002 decision: do not collapse the chronology. Do not name relatives or describe conflict on screen unless Shane says so.' },
        { id: 'roots-turn', type: 'quote', status: 'verified', editorial: true,
          eyebrow: 'The first intentional turn',
          title: 'Knowing What You Don\'t Want',
          body: 'Sometimes knowing what you don\'t want is enough to choose a different direction.',
          image: { wanted: 'None needed: the mountain path behind the panel is the image' },
          notes: 'EDITORIAL paraphrase, not a verbatim quote. Responsibility versus autonomy; ability versus meaningful work. Bridge to Deming in the next chapter.' }
      ]
    },
    /* ------------------------------------------------------------------ 2 */
    {
      id: 'way', title: 'Finding My Way', short: 'My way', kind: 'lamp', minutes: 8,
      node: { x: 30, z: -34, az: 12, el: 16, dist: 52, anchor: 0.3 },
      slides: [
        { id: 'way-mountains', type: 'split', status: 'verified',
          eyebrow: 'Finding my way',
          title: 'The Mountains Felt Like Home',
          body: ['Boone, the Outer Banks, Brevard.', 'I wasn\'t chasing a plan. I was noticing what felt like home.'],
          image: { src: '/assets/img/wr-mountain-hike.jpg', alt: 'Shane smiling on a grassy mountain ridge with layered blue mountains behind him', ratio: '4 / 3', pos: 'center 40%' },
          notes: 'Campbell University 1996 to 1998; Appalachian State 1998 to 1999; Nags Head and outdoor education on the Outer Banks. Arriving in Brevard around 2002 felt like home, especially the descent toward Pisgah Forest from Mills River.' },
        { id: 'way-outdoors', type: 'quote', status: 'verified', editorial: true,
          eyebrow: 'Finding my way',
          title: 'When My Comfort Zone Changed',
          body: ['The outdoors became comfortable.', 'Growth turned toward people and organizations.'],
          image: { src: '/assets/img/wr-sunset-walk.jpg', alt: 'A silhouetted hiker with a pack walking against an orange sunset sky', ratio: '3 / 2', pos: 'center' },
          notes: 'Wording is close to Shane\'s spoken phrasing, shown as an editorial line. A wilderness leadership immersion semester challenged the idea that camping must push you out of your comfort zone. The next kind of growth meant going inside: studying organizations and people.' },
        { id: 'way-ideas', type: 'split', status: 'draft',
          eyebrow: 'Finding my way',
          title: 'Two Ideas That Changed Everything',
          body: ['Deming: the kind of workplace worth building.', 'Campbell: the kind of work worth pursuing.'],
          quotes: [
            { text: 'People are entitled to joy in work.', who: 'W. Edwards Deming', portrait: null },
            { text: 'Follow your bliss.', who: 'Joseph Campbell', portrait: null }
          ],
          image: { wanted: 'Optional portraits of Deming and Campbell, supplied by Shane from a licensed or public-domain source. Claude does not place photos of public figures.' },
          notes: 'Brevard integrated studies and organizational leadership, final year 2003 to 2004. Deming clarified the kind of workplace Shane wanted; Campbell encouraged the kind of work worth pursuing. They are two distinct philosophies, used as lenses, not a lecture: both return later (Deming at the team pivot and at Joy as a System). SOURCE CHECK before publishing: the Deming line is widely credited to him (The Deming Institute lists it) but confirm the exact book and page; Campbell\'s phrase comes from The Power of Myth (with Bill Moyers, 1988).' }
      ]
    },
    /* ------------------------------------------------------------------ 3 */
    {
      id: 'bliss', title: 'Following My Bliss', short: 'Bliss', kind: 'beacon', minutes: 6,
      node: { x: -34, z: -56, az: -14, el: 16, dist: 54, anchor: 0.7 },
      slides: [
        { id: 'bliss-music', type: 'split', status: 'verified',
          eyebrow: 'Following my bliss',
          title: 'Music Was a Choice',
          body: 'I went back to Brevard to pursue percussion, with no promise of a career.',
          image: { src: '/assets/img/wr-drumming.jpg', alt: 'Shane playing a drum kit outdoors', ratio: '4 / 3', pos: 'center' },
          notes: 'Back to Brevard for a second degree in 2006; percussion and music performance in 2008. Audio, lighting and recording; touring and managing bands. Carpentry continued in parallel. The band photo High Flying Criminals (Ken Voltz) is available if a band shot is wanted: keep the credit on screen.' },
        { id: 'bliss-aviation', type: 'split', status: 'verified',
          eyebrow: 'Following my bliss',
          title: 'Some Dreams Never Leave You',
          body: 'Model fighter jets. A childhood fascination with flight.',
          image: { src: '/assets/img/fly-ridge.jpg', alt: 'Three paragliders in a wide evening sky over a ridge',
                   caption: 'Paragliders over a ridge, much later in life' },
          notes: 'Childhood model jets (F-14, F-16, F-4, A-10) hung from fishing line in simulated dogfights, moved by the ceiling fan. A love of flight, racing games and aviation films. A childhood model-airplane photo would replace this image if one exists.' },
        { id: 'bliss-sky', type: 'split', status: 'verified',
          eyebrow: 'Following my bliss',
          title: 'Finding the Sky',
          body: ['Paragliding. Skydiving. Wind-tunnel flight.', 'I wasn\'t chasing a business. I was chasing an interest.'],
          image: { src: '/assets/img/wr-skydive-selfie.jpg', alt: 'Shane smiling in a skydiving helmet in freefall above farmland', ratio: '4 / 3', pos: 'center 35%' },
          notes: 'Paragliding training began near western North Carolina and finished in Utah at Point of the Mountain. Skydiving, and work at the Maggie Valley wind tunnel. During a hard stretch in life, flying reconnected him with joy. Keep intimate details off the screen. A wind-tunnel photo would be a good optional addition.' }
      ]
    },
    /* ------------------------------------------------------------------ 4 */
    {
      id: 'detour', title: 'The Unexpected Detour', short: 'Detour', kind: 'lamp', minutes: 7,
      node: { x: 22, z: -78, az: 10, el: 16, dist: 56, anchor: 0.3 },
      slides: [
        { id: 'detour-road', type: 'title', status: 'verified',
          eyebrow: 'The unexpected detour',
          title: 'The Road Changed',
          body: '2012 to 2015: incarceration',
          image: { src: '/assets/img/wr-fci-edgefield.jpg', alt: 'The entrance road and guard tower of a federal correctional institution, framed by pine trees', ratio: '16 / 9', pos: 'center 60%',
                   caption: 'FCI Edgefield, South Carolina' },
          notes: 'Candid and calm, not a sensational reveal and not a redemption arc. The photo is Shane\'s own choice (the facility where he served); it looks like a street-level web capture, so confirm its source before sharing the public link widely. Incarcerated from April 2012 to early March 2015. The detailed account stays in Shane\'s private notes.' },
        { id: 'detour-agency', type: 'split', status: 'verified',
          eyebrow: 'The unexpected detour',
          title: 'Finding Agency Within Constraints',
          body: 'When I couldn\'t choose where I was, I could still make choices about how I spent my time.',
          image: { wanted: 'Handwritten music or books, if Shane has them. Otherwise text only.' },
          notes: 'Reading, yoga and meditation helped during the most restricted stretch. Later he taught music, composed with a friend, organized sand-volleyball leagues and built relationships. This is one person\'s experience: do not generalize it to prison broadly.' },
        { id: 'detour-show-up', type: 'quote', status: 'verified', editorial: true,
          eyebrow: 'The unexpected detour',
          title: 'Choose How You Show Up',
          body: 'You can\'t always choose what happens next. But sometimes you can choose your next step.',
          image: { wanted: 'None needed' },
          notes: 'PROPOSED EDITORIAL LINE that Shane approved as the concept: not a verbatim quotation. The takeaway he most wants to emphasize. Acknowledge the limits on choice and the structural realities. This is not "prison was a blessing".' }
      ]
    },
    /* ------------------------------------------------------------------ 5 */
    {
      id: 'again', title: 'Starting Over', short: 'Starting over', kind: 'beacon', minutes: 7,
      node: { x: -20, z: -100, az: -12, el: 16, dist: 56, anchor: 0.7 },
      slides: [
        { id: 'again-freedom', type: 'split', status: 'verified',
          eyebrow: 'Starting over',
          title: 'Freedom Can Feel Overwhelming',
          body: 'My first grocery trip was almost too much.',
          image: { src: '/assets/img/wr-portrait-clouds.jpg', alt: 'Shane smiling in front of a hillside under a dramatic cloudy sky', ratio: '4 / 3', pos: 'center 60%' },
          notes: 'The first grocery store after release nearly caused panic because of the sheer amount of choice. Reentry meant a halfway house, then his parents\' home, restricted travel, and rebuilding trust.' },
        { id: 'again-intention', type: 'quote', status: 'verified', editorial: true,
          eyebrow: 'Starting over',
          title: 'Rebuilding With Intention',
          body: 'I didn\'t need to figure out my entire future. I needed to choose my next step.',
          image: { src: '/assets/img/wr-ground-handling.jpg', alt: 'A pilot ground-handling a paraglider with a moustache graphic over a hillside', ratio: '4 / 3', pos: 'center 40%' },
          notes: 'Carpentry work in DC. He waited for permission to travel and train, aimed for his instructor qualification and found a skydiving drop zone. Instructor rating completed in 2018.' },
        { id: 'again-marathon', type: 'split', status: 'verified',
          eyebrow: 'Starting over',
          title: 'The Music Marathon',
          body: ['Three shows in five days.', 'Reclaiming joy.'],
          image: { src: '/assets/img/wr-music-marathon.jpg', alt: 'A band playing in a venue with drums, percussion and bass, a little blurred', ratio: '4 / 3', pos: 'center 40%' },
          notes: 'A visit to Brevard: two days of rehearsal, then three gigs in five days with friends. It led to a new band and helped seal the move back to Brevard and Asheville.' }
      ]
    },
    /* ------------------------------------------------------------------ 6 */
    {
      id: 'entrepreneur', title: 'The Accidental Entrepreneur', short: 'Entrepreneur', kind: 'lamp', minutes: 9,
      node: { x: 42, z: -118, az: 12, el: 16, dist: 58, anchor: 0.3 },
      slides: [
        { id: 'ent-syllabus', type: 'split', status: 'verified',
          eyebrow: 'The accidental entrepreneur',
          title: 'A 94-Page Syllabus and a Stack of DVDs',
          body: 'Students deserved something better.',
          image: { wanted: 'The syllabus cover or a page, if Shane still has it. Nothing fabricated.' },
          notes: 'Around 2018, paragliding instruction used a dense 94-page text syllabus and DVDs. Newly rated as an instructor, Shane saw an access and usability problem.' },
        { id: 'ent-wix', type: 'split', status: 'verified',
          eyebrow: 'The accidental entrepreneur',
          title: 'I Built It With Wix',
          body: 'I didn\'t know how to build a software company. I knew how to make something better for my students.',
          image: { src: '/assets/img/wr-training-site-early.jpg', alt: 'The early Paraglider Training website: Time to Fly, with student and instructor login and sign-up', ratio: '2 / 1', pos: 'center',
                   caption: 'The early training site' },
          notes: 'He reworked the syllabus into chapter navigation and digital learning. No payments and no true LMS at first, only account registration. Do not claim full learning-management features at launch.' },
        { id: 'ent-world', type: 'timeline', status: 'verified',
          eyebrow: 'The accidental entrepreneur',
          title: 'The World Showed Up',
          items: [
            { when: 'Nearly 2,000', what: 'learners' },
            { when: '60 to 70', what: 'countries' },
            { when: 'Organic', what: 'growth' }
          ],
          image: { wanted: 'None. Numbers only: no invented map or analytics.' },
          notes: 'Shane\'s recollection is roughly 1,000 to 2,000 signups across 2018 and 2019 from 60 to 70 countries. Say "nearly 2,000" as a memory, not an audited number. Other instructors then asked for dashboards, progress, quiz results, certificates and flight logs.' },
        { id: 'ent-five-thousand', type: 'quote', status: 'verified', editorial: true,
          eyebrow: 'The accidental entrepreneur',
          title: 'The First $5,000',
          body: 'The people I was helping showed me I had a business.',
          image: { wanted: 'A product screenshot, if available' },
          notes: 'EDITORIAL line. Three schools suggested about $40 to $50 per student and a PayPal donation button. The first roughly $5,000 paid for forming Online Training Concepts LLC, the EIN and a bank account in 2019. Demand and product requests led the business model, not the other way around.' }
      ]
    },
    /* ------------------------------------------------------------------ 7 */
    {
      id: 'aktiga', title: 'Building Aktiga, Then Pivoting', short: 'Aktiga', kind: 'beacon', minutes: 9,
      node: { x: -6, z: -142, az: -10, el: 16, dist: 60, anchor: 0.7 },
      slides: [
        { id: 'akt-services', type: 'timeline', status: 'verified',
          eyebrow: 'Building Aktiga',
          title: 'From Products to Possibilities',
          items: [
            { when: 'Paragliding', what: 'the first course' },
            { when: 'Skydiving', what: 'the next one' },
            { when: 'Ballet', what: 'Learn Ballet' },
            { when: 'Nonprofit learning', what: 'for organizations' }
          ],
          image: { src: '/assets/img/wr-learn-ballet.jpg', alt: 'The Learn Ballet home page: a teal logo, a ballerina leaning back and student, teacher and login panels', ratio: '5 / 2', pos: 'center 55%',
                   caption: 'Learn Ballet' },
          notes: 'Each step grew out of helping someone. Shane built skydiving and Learn Ballet, the latter for his mother, a longtime Cecchetti ballet teacher and examiner; multiple schools used it. COVID shifted Online Training Concepts toward organizations that needed help with learning systems. Say plainly that the agency work was useful but less fulfilling, to set up the pivot story later. Get approval before showing any client screenshot.' },
        { id: 'akt-immersive', type: 'split', status: 'verified',
          eyebrow: 'Building Aktiga',
          title: 'Chasing a New Possibility',
          body: ['2023: Aktiga. Immersive learning, 3D and VR on the web.', 'Fascinating technology isn\'t the same as a sustainable business.'],
          image: { src: '/assets/img/wr-xrwd-home.jpg', alt: 'The XRWD website home page: the layered XRWD logo, a purpose statement and an Overview section about spatial experiences on the web', ratio: '16 / 10', pos: 'center top',
                   caption: 'XRWD: Extended Responsive Web Design' },
          notes: 'In 2023 Shane founded Aktiga to pursue web-native immersive learning with three.js, React Three Fiber and ReactXR, and read the research on immersive learning outcomes. Do not quote comparative learning-efficacy numbers without a source. About 18 to 19 months of research and development, a white paper and conference work. The curiosity was real and compelling; the sustainable business was uncertain.' },
        { id: 'akt-helene', type: 'split', status: 'verified', editorial: true,
          eyebrow: 'September 2024',
          title: 'Hurricane Helene Changed Everything',
          body: 'When the path disappeared, we had to find another way forward.',
          image: { wanted: 'One or two authentic Helene flood photos from a friend. Contained frame only. Photographer credit and permission needed. Nothing stock or fabricated.' },
          notes: 'Helene disrupted Asheville and narrowed Aktiga\'s viable paths while financial pressure was already building. Describe it accurately: Helene created pressure, but it was not the only cause of the pivot. Keep the tone human and specific to what the team lived through, not dramatic. Slow down on this slide.' },
        { id: 'akt-team', type: 'quote', status: 'verified', editorial: true,
          eyebrow: 'Building Aktiga',
          title: 'The Team Showed Me Another Way',
          body: 'Circumstances forced us to reconsider. The team helped us choose a direction.',
          attribution: 'Deming\'s idea, back again: pride and joy in the work.',
          image: { src: '/assets/img/work-card.jpg', alt: 'The Aktiga office, a circular slatted wall sculpture beside an open workspace', caption: 'The Aktiga office' },
          notes: 'Hurricane Helene in September 2024 put the company under pressure; in January 2025 the team reached consensus to offer its software development process as a service. Shane was disappointed at first about returning to agency-style work and listened; relief came once clients and revenue arrived. Key distinction: Helene created pressure; the team helped determine the response. Deming returns here: people shaping a workplace where they take pride and joy in the work. Tie back to the opening question of what kind of workplace he could thrive in. A team photo would replace the office image.' }
      ]
    },
    /* ------------------------------------------------------------------ 8 */
    {
      id: 'meaning', title: 'Finding Meaning in the Work', short: 'Meaning', kind: 'lamp', minutes: 7,
      node: { x: 26, z: -158, az: 12, el: 16, dist: 62, anchor: 0.3 },
      slides: [
        { id: 'mean-people', type: 'split', status: 'verified',
          eyebrow: 'Finding meaning in the work',
          title: 'Not Technology for Its Own Sake',
          body: 'More capacity for people doing essential work.',
          image: { wanted: 'Client-approved screenshots only. No sensitive client data on screen.' },
          notes: 'Aktiga works with mission-driven teams that are often overworked and under-resourced, helping them do essential work with more capacity. Possible grounded examples: Homeward Bound of WNC and its AHOPE Day Center, ArtsAVL, Invest Appalachia. CONFIRM which of these are actual clients before naming any on screen. No confidential details or unapproved screenshots.' },
        { id: 'mean-products', type: 'quote', status: 'verified', editorial: true,
          eyebrow: 'Finding meaning in the work',
          title: 'Joy as a System',
          body: 'Entrepreneurship isn\'t just an exit plan. It can be a life plan.',
          image: { src: '/assets/img/work-stage.jpg', alt: 'Shane presenting Agenda Keeper on stage at Venture Connect, a slide reading The Problem behind him',
                   caption: 'Pitching Agenda Keeper at Venture Connect' },
          notes: 'Bring the threads together: the team, meaningful client work, continued product exploration including Agenda Keeper (beta 2025, rebuilt 2026, launched publicly fall 2026), and Deming\'s ideal of a workplace where people take joy in the work. Campbell and Deming, curiosity and intentional choice. The road is still unfolding. Do not state traction or revenue numbers Shane has not given.' },
        { id: 'mean-final', type: 'final', status: 'draft', editorial: true,
          title: 'Your journey will look different. That\'s the point.',
          byline: 'Shane Parreco',
          urls: ['aktiga.com', 'shaneparreco.com', 'onlinetrainingconcepts.com'],
          image: { wanted: 'None. The winding mountain path is the image.' },
          notes: 'Final slide. Say the line, pause, stop. Do not read the websites aloud and do not say thank you. Leave it displayed so people can photograph or note the addresses before moving to the fireside chat in the other room. The layout of the three addresses is not locked: press V to flip between option A (right-aligned stair-step) and option B (Aktiga and Online Training Concepts together, personal site beneath). Addresses verified: aktiga.com, shaneparreco.com, onlinetrainingconcepts.com (the LinkedIn company page lists this one).' }
      ]
    }
  ]
};

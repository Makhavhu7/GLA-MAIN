const fetch = require('node-fetch');
const natural = require('natural');
const levenshtein = require('fast-levenshtein');

function stripMetadata(content) {
  // Remove all source/metadata indicators from content before sending to client
  return content
    .replace(/based\s+solely\s+on\s+the\s+provided\s+context\s*:?\s*/gi, '')
    .replace(/\*\*source\*\*\s*:\s*.*$/gmi, '')
    .replace(/source\s*:\s*.*$/gmi, '')
    .replace(/source\s*:\s*\S+.*?(?=\n|$)/gi, '')
    .replace(/\*\*note\*\*:?\s*this\s+is\s+a\s+fallback.*?contact.*?\.?/gi, '')
    .replace(/note:\s*this\s+is\s+a\s+fallback.*?contact\s+.*?\.?/gi, '')
    .replace(/http\s+error!?\s+status:\s*\d+/gi, '')
    .replace(/for\s+more\s+details,\s+contact\s+.*?\.?/gi, '')
    .replace(/please\s+try\s+again\s+or\s+ask\s+about.*?\.?$/gmi, '')
    .replace(/MGSLG_PGDip_Module_\d+__.*?\.pdf.*?(?=\n|$)/gi, '')
    .replace(/\.pdf.*?(?:\n|$)/gi, '')
    .replace(/page\s+\d+/gi, '')
    .replace(/the\s+provided\s+context\s*[:,]?\s*/gi, '')
    .replace(/according\s+to\s+the\s+context\s*[:,]?\s*/gi, '')
    // Remove recommendation/suggestion phrases
    .replace(/i\s+recommend\s+contacting\s+grit\s+lab\s+africa.*?(?=\n|$)/gi, '')
    .replace(/they\s+can\s+provide\s+the\s+most\s+reliable\s+information.*?(?=\n|$)/gi, '')
    .replace(/you\s+may\s+want\s+to\s+contact.*?(?=\n|$)/gi, '')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/www\.[^\s]+/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
const baseUrl = 'https://www.gritlabafrica.org';
const footerData = {
  address: 'Grit Lab Africa, 69 Kingsway Avenue, JBS Park, Auckland Park, South Africa',
  workingHours: 'Monday – Friday: 8am – 5pm, Saturday: Closed, Sunday: Closed',
  contact: 'Phone: 011 599 1989, Email: info@gritlabafrica.org',
  social: 'Facebook, Instagram, YouTube, X, Twitch'
};

const synonymMap = {
  'starter': 'founder',
  'bootcamp': 'program',
  'bootcapm': 'program',
  'sponsor': 'support',
  'sponsors': 'support',
  'benefit': 'benefits',
  'skill': 'skills',
  'help': 'benefits',
  'when': 'founded',
  'dis': 'did',
  'start': 'founded',
  'certificate': 'certification',
  'cert': 'certification',
  'team': 'staff',
  'teams': 'staff',
  'project': 'projects',
  'nopt': 'not',
  'eairlier': 'earlier'
};

function correctSpelling(query) {
  const corrections = {
    'dis': 'did',
    'bootcapm': 'bootcamp',
    'skils': 'skills',
    'benifit': 'benefit',
    'sponser': 'sponsor',
    'awar': 'award',
    'nopt': 'not',
    'eairlier': 'earlier',
    'certifcate': 'certificate',
    'teem': 'team',
    'projcts': 'projects'
  };
  let corrected = query.toLowerCase().trim();
  Object.keys(corrections).forEach(misspelled => {
    corrected = corrected.replace(new RegExp(`\\b${misspelled}\\b`, 'g'), corrections[misspelled]);
  });
  Object.keys(synonymMap).forEach(word => {
    if (levenshtein.get(corrected, word) <= 2) {
      corrected = corrected.replace(new RegExp(`\\b${word}\\b`, 'g'), synonymMap[word]);
    }
  });
  return corrected;
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing query in request body' })
      };
    }

    const { query, userId } = JSON.parse(event.body);
    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing query in request body' })
      };
    }

    // Note: Rate limiting is now handled by OpenRouter

    const normalizedQuery = correctSpelling(query);
    const contextData = [
      {
        source: `${baseUrl}/`,
        content: 'GRIT Lab Africa is a non-profit founded in 2016 by Professor Abejide Ade-Ibijola. Mission: Offer free training in computer programming skills and provide mentoring in mindset, discipline, and GRIT to young Africans. Vision: Create an inclusive space that trains diverse young Africans regardless of background, gender, race, religion, or ethnicity to become champions in computer programming, building not only technical skills but also strong characters that care about helping others and addressing societal issues through technology. Contact: Phone 011 599 1989, Email info@gritlabafrica.org, Address: 69 Kingsway Avenue, JBS Park, Auckland Park, South Africa. Working Hours: Monday-Friday 8am-5pm.'
      },
      {
        source: `${baseUrl}/about`,
        content: 'GRIT Lab Africa offers comprehensive training programs including: Introductory Programming, Data Structures and Algorithms, Web Development, Mobile App Development, Game Development, Data Science, and Machine Learning. The organization has trained 2000+ students since 2016 with a 100% graduate employment rate. Graduates earn competitive salaries up to R22,000/month for undergraduates and R37,500/month for fresh graduates. 593 Grit-ers study across 11 countries in 38 higher institutions. In 2023 alone, R28 million worth of free training was offered. GLA focuses on hands-on 4IR (Fourth Industrial Revolution) skills, bringing together the brightest minds in a mentorship environment. Key benefits include exposure to the founder\'s network in industry and academia, validation through professional certification, and job creation/startup incubation opportunities.'
      },
      {
        source: `${baseUrl}/about#why-gla`,
        content: 'Why GRIT Lab Africa: Not a conventional classroom - focuses on industry-needed skills for the Fourth Industrial Revolution. Hands-on training in cutting-edge technologies. Iron Sharpens Iron - mentees interact with brightest minds. Africa Royalty - united and confident young Africans co-solving problems. Exposure and Access to founder\'s network in industry and academia. Validation - Professional certification by Professor Ade-Ibijola (PhD, professor, subject matter expert). Family - Be part of a supportive family across Africa. Employment - Job creation and startup incubation. Worthiness - Learning, character, GRIT, with consciousness for social impact.'
      },
      {
        source: `${baseUrl}/Apply.html`,
        content: 'Eligibility Requirements: 1) 18-21 years old (if younger or slightly older, add motivation to application), 2) African resident (every race welcome), 3) Registered in a recognized African higher institution of learning, 4) Studying a STEM-related first degree/diploma or non-STEM with high interest in developing technologies, 5) Must be in first or second year of study, 6) Average mark equal to or above 65% (proof required), 7) No prior programming knowledge needed but ability to stay disciplined is crucial. Applications now open. Apply at glabootcamp.netlify.app/apply'
      },
      {
        source: `${baseUrl}/OurTeam.html`,
        content: 'Founder and Chairman: Professor Abejide Ade-Ibijola - Full Professor of Artificial Intelligence and Applications at Johannesburg Business School, University of Johannesburg, South Africa. Co-Directors: Suhail Ally (Software Developer, Dariel), Ms. Anthea Windvogel (Founder of ElevateHer). Collaborators include Stephen Obare (Kenya), Dr Elizabeth Mkoba (Nelson Mandela African Institute of Science and Technology, Tanzania), Prof. Francisca O. Oladipo (Vice-Chancellor TAU, Nigeria), Dr. Pius Onobhayedo (Pan-Atlantic University, Nigeria), Prof. Adenike Osofisan (University of Ibadan, Nigeria), Prof. Abdalla Ahmed Elbashir (University of Khartoum, Sudan).'
      },
      {
        source: `${baseUrl}/about#achievements`,
        content: 'GRIT Lab Africa Achievements: 2000+ students trained since 2016, 593 Grit-ers across 11 African countries, 25 countries historical reach, 38 higher institutions reach, R28 million free training value in 2023, 100% graduate employment rate, competitive salaries (R22,000-R37,500/month), reduced unemployment among participants, equipped with web/mobile/game development skills, brought back discipline in young Africans, created united community of diverse African backgrounds.'
      },
      {
        source: `${baseUrl}/recent-grit-ers`,
        content: 'GRIT Lab Africa participants work on industry-relevant projects in Web Development, Mobile App Development, Game Development, Data Science, and Machine Learning. Participants develop real-world solutions addressing societal issues using technology.'
      },
      {
        source: `${baseUrl}/support-gla`,
        content: 'GRIT Lab Africa seeks sponsors and supporters for laptops, internet connectivity, hackathon events, and other program needs. Sponsorship opportunities available. Contact info@gritlabafrica.org to become a supporter or sponsor.'
      },
      {
        source: `${baseUrl}/about#kingsman-academic`,
        content: 'The Kingsman Academic is an identity symbolizing a person who: is able to transcend the divisions in society, continuously acquires future-fit skills, solves for society using technology, and helps others. GRIT Lab Africa trains such young people across Africa to become Kingsman Academics - leaders who can bridge divides and drive technological innovation for social good.'
      }
    ];

    let answer = '';
    let source = 'GRIT Lab Africa Website';
    let scores = [];

    // PRIORITY 1: Check if query matches a direct response pattern - MUST return immediately
    let directMatch = false;
    
    // Match "what is gla" - most common question
    if (normalizedQuery.match(/(\bwhat\s+(is|are)\s+gla\b|\bgla\s+overview\b|\btell\s+me\s+about\s+gla\b)/i)) {
      answer = `<p>GRIT Lab Africa is a non-profit founded in 2016 by Professor Abejide Ade-Ibijola, dedicated to providing free training in computer programming skills and mentoring in mindset, discipline, and GRIT to young Africans. The organization has trained 2000+ students across 11 African countries with a 100% employment rate. GRIT Lab focuses on hands-on 4th Industrial Revolution skills including Programming, Web Development, Mobile Apps, Game Development, Data Science, and Machine Learning.</p>`;
      directMatch = true;
    }
    // Match programs/courses
    else if (normalizedQuery.match(/\b(what\s+programs|what\s+courses|what\s+training|offer)\b/i)) {
      answer = `<p>GRIT Lab Africa offers comprehensive training including: Introductory Programming, Data Structures and Algorithms, Web Development, Mobile App Development, Game Development, Data Science, and Machine Learning. All training is hands-on and focused on Fourth Industrial Revolution skills needed by industry.</p>`;
      directMatch = true;
    }
    // Match founder/professor
    else if (normalizedQuery.match(/\b(who\s+founded|founder|professor\s+ade|professor\s+abejide)\b/i)) {
      answer = `<p>GRIT Lab Africa was founded in 2016 by Professor Abejide Ade-Ibijola, a Full Professor of Artificial Intelligence and Applications at Johannesburg Business School, University of Johannesburg, South Africa.</p>`;
      directMatch = true;
    }
    // Match application/eligibility
    else if (normalizedQuery.match(/\b(how\s+do\s+i\s+apply|application\s+requirements|eligibility|apply\s+to|join)\b/i)) {
      answer = `<p>To apply to GRIT Lab Africa: 1) Be 18-21 years old, 2) Be an African resident, 3) Be registered in an accredited African higher institution, 4) Study STEM or non-STEM with tech interest, 5) Be in 1st or 2nd year with 65%+ average, 6) Be disciplined (no prior programming needed). Apply at glabootcamp.netlify.app/apply</p>`;
      directMatch = true;
    }
    // Match employment/outcomes
    else if (normalizedQuery.match(/\b(employment\s+rate|graduate\s+outcomes|job\s+placement|salaries|earn)\b/i)) {
      answer = `<p>GRIT Lab Africa has a 100% graduate employment rate. Graduates earn competitive salaries: R22,000/month for undergraduates and R37,500/month for fresh graduates. Graduates work in web/mobile/game development, data science, and start their own tech ventures.</p>`;
      directMatch = true;
    }
    // Match benefits
    else if (normalizedQuery.match(/\b(benefits|why\s+join|why\s+gla)\b/i)) {
      answer = `<p>Benefits of GRIT Lab Africa: Hands-on 4IR skills training, mentorship by brightest minds, exposure to founder's industry network, professional certification, job creation and startup opportunities, family-like community across Africa, and development of character with social impact consciousness.</p>`;
      directMatch = true;
    }
    // Match team
    else if (normalizedQuery.match(/\b(team\s+members|gla\s+team|who\s+works|staff)\b/i)) {
      answer = `<p>GRIT Lab Africa team includes Professor Abejide Ade-Ibijola (Founder), Suhail Ally (Software Developer, Co-Director), Ms. Anthea Windvogel (Founder of ElevateHer, Co-Director), and collaborators from Kenya, Tanzania, Nigeria, and Sudan.</p>`;
      directMatch = true;
    }
    // Match bootcamp completion/certificates/graduation
    else if (normalizedQuery.match(/\b(what\s+do\s+i\s+get|bootcamp\s+(completion|end|finish)|certificate|certification|graduation|diploma|award)\b/i)) {
      answer = `<p>Upon successful completion of the GRIT Lab Africa bootcamp, participants receive: 1) Professional Certification of expertise validated by Professor Abejide Ade-Ibijola (PhD, subject matter expert), 2) Recognition as a trained professional in your chosen field (Web Development, Mobile Apps, Game Development, Data Science, or Machine Learning), 3) Access to the GRIT Lab Africa alumni network across Africa, 4) Career support and job placement assistance with a 100% employment rate, 5) Continued mentorship and community support. Graduates are equipped with industry-ready skills and are recognized as "Kingsman Academics" - leaders who can bridge divides and drive technological innovation for social good.</p>`;
      directMatch = true;
    }

    // PRIORITY 2: Check contact information
    if (!directMatch && normalizedQuery.match(/contact|phone|email|address|location|hours|social/i)) {
      if (normalizedQuery.includes('address') || normalizedQuery.includes('location')) {
        answer = `<p>${footerData.address}</p>`;
        source = 'GRIT Lab Africa Website Footer';
      } else if (normalizedQuery.includes('hours')) {
        answer = `<p>${footerData.workingHours}</p>`;
        source = 'GRIT Lab Africa Website Footer';
      } else if (normalizedQuery.includes('contact') || normalizedQuery.includes('phone') || normalizedQuery.includes('email')) {
        answer = `<p>${footerData.contact}</p>`;
        source = 'GRIT Lab Africa Website Footer';
      } else if (normalizedQuery.includes('social')) {
        answer = `<p>Social media: ${footerData.social}</p>`;
        source = 'GRIT Lab Africa Website Footer';
      }
      directMatch = true;
    }

    // PRIORITY 3: Use API for other queries
    if (!directMatch) {
      const tokenizer = new natural.WordTokenizer();
      const queryTokens = tokenizer.tokenize(normalizedQuery);
      scores = contextData.map(doc => {
        const docTokens = tokenizer.tokenize(doc.content.toLowerCase());
        const intersection = queryTokens.filter(token => docTokens.includes(token));
        const score = intersection.length / Math.max(queryTokens.length, 1);
        return { source: doc.source, score };
      }).sort((a, b) => b.score - a.score);

      const bestMatch = scores[0];
      const context = contextData.find(doc => doc.source === bestMatch.source)?.content || '';

      // Model fallback array
      const models = [
        'anthropic/claude-opus-4.6',
        'liquid/lfm-2.5-1.2b-thinking:free',
        'upstage/solar-pro-3:free',
        'arcee-ai/trinity-large-preview:free',
        'sourceful/riverflow-v2-pro'
      ];

      let openRouterResponse = null;
      let modelUsed = null;

      // Try each model with fallback
      for (const model of models) {
        try {
          openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer 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',
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://www.gritlabafrica.org',
              'X-Title': 'GRIT Lab Africa Chatbot'
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: 'You are a helpful assistant for GRIT Lab Africa. Provide accurate, detailed answers about the organization, its programs, and opportunities. Use the provided context as primary source. If the context is incomplete or the question requires external knowledge, you may use your general knowledge to provide a comprehensive answer. Focus on being helpful and informative. Never fabricate facts - if you are truly uncertain, acknowledge it and suggest contacting info@gritlabafrica.org. Keep responses concise but thorough.' },
                { role: 'user', content: `Context about GRIT Lab Africa: ${context}\n\nUser Question: ${normalizedQuery}\n\nProvide a clear, accurate, and complete answer. If the provided context is limited, use your knowledge to give a helpful response about GRIT Lab Africa and its bootcamp programs.` }
              ],
              max_tokens: 500
            })
          });

          if (openRouterResponse.ok) {
            const data = await openRouterResponse.json();
            const rawContent = data.choices[0].message.content;
            answer = `<p>${stripMetadata(rawContent)}</p>`;
            modelUsed = model;
            console.log(`Successfully used model: ${model}`);
            break;
          } else {
            console.error(`Model ${model} failed with status:`, openRouterResponse.status);
          }
        } catch (error) {
          console.error(`Error with model ${model}:`, error.message);
        }
      }

      // If all models fail, return error message
      if (!modelUsed) {
        console.error('All models failed');
        answer = '<p>Sorry, I could not retrieve information at this moment. Please try again later or contact info@gritlabafrica.org for assistance.</p>';
      }
    }

    // Strip all metadata before returning to client
    const cleanAnswer = stripMetadata(answer);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content: cleanAnswer, source, scores })
    };
  } catch (error) {
    console.error('Function error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Unable to process your request. Please try again.' })
    };
  }
};
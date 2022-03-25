import { loadVocabulary } from 'spelling-ukraine-data';
import { listenToContent, postReply } from './reddit';
import { delay } from './utils/promise';

const vocabulary = loadVocabulary().filter((entry) =>
  ['kyiv', 'lviv', 'kharkiv', 'mykolaiv', 'chornobyl', 'irpin'].includes(entry.id)
);

const sampling = 0.25;

const subreddits = [
  'ukraine',
  'ukraina',
  'ukrainian',
  'ukraineisverybadass',
  'ukrainianconflict',
  'ukraineconflict',
  'volunteersforukraine',
  '2russophobic4you',
  'europe',
  'yurop',
  'news',
  'worldnews',
  'politics',
  'war',
  'pics',
  'interesting',
  'damnthatsinteresting',
  'thatsinsane'
];

const main = async () => {
  console.log('Reddit bot is starting...');

  const predicates = vocabulary.flatMap((entry) =>
    entry.incorrectSpellings.flatMap((spelling) => ({ entry, keyword: spelling }))
  );

  console.log('Listening to subreddits', subreddits);

  let consecutiveReplyFailures = 0;
  await Promise.all(
    subreddits.map(async (subreddit) => {
      // Random stagger to avoid hitting rate limit
      await delay(60 * Math.random() * 1000);

      await listenToContent(subreddit, async (content) => {
        if (content.author === 'SpellingUkraine') {
          return;
        }

        const titleNormalized = content.kind === 'submission' ? content.title : '';

        // Remove u/foo and r/bar mentions
        const textNormalized = content.text
          .replace(/\b\/?u\/\w+\b/g, '')
          .replace(/\b\/?r\/\w+\b/g, '');

        const match = predicates.find((predicate) => {
          const keywordPattern = new RegExp(`\\b${predicate.keyword}\\b`, 'gi');

          const correctSpellingPattern = new RegExp(
            `\\b${predicate.entry.correctSpelling}\\b`,
            'gi'
          );

          return (
            (keywordPattern.test(titleNormalized) &&
              !correctSpellingPattern.test(titleNormalized)) ||
            (keywordPattern.test(textNormalized) && !correctSpellingPattern.test(textNormalized))
          );
        });

        if (!match) {
          return;
        }

        if (Math.random() > sampling) {
          return;
        }

        console.log('Content', content);
        console.log('Match', {
          correct: match.entry.correctSpelling,
          incorrect: match.keyword
        });

        try {
          const reply = await postReply(
            content,
            [
              `💡 It's \`${match.entry.correctSpelling}\`, not \`${match.keyword}\`. `,
              `Support Ukraine by using the correct spelling! `,
              `[Learn more](https://spellingukraine.com/i/${match.entry.id}).`,
              `\n\n___\n\n`,
              `[^(Why does spelling matter?)](https://spellingukraine.com) ^(| Beep boop I'm a bot)`
            ].join('')
          );

          console.log('Reply', reply);
          consecutiveReplyFailures = 0;
        } catch (err) {
          // Replies may fail for various reasons, but not consistently.
          // Throw if we have too many consecutive failures.
          if (++consecutiveReplyFailures >= 10) {
            throw err;
          }

          console.log(`Reply failure (${consecutiveReplyFailures})`, err);
          await delay(5 * 60 * 1000); // 5 minutes
        }
      });
    })
  );
};

main().catch((err) => console.error('Error', err));

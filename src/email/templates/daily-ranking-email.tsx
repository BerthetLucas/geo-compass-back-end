import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
  Link,
} from 'react-email';
import type { BrandRanking } from '../../ranking/ranking.types';
import { barebonesBoxedTailwindConfig } from './theme';
import { BarebonesFonts } from './theme-fonts';

interface DailyResultsEmailProps {
  ranking: BrandRanking[];
  date: Date;
}

export function DailyResultsEmail({ ranking, date }: DailyResultsEmailProps) {
  const dateLabel = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Tailwind config={barebonesBoxedTailwindConfig}>
      <Html>
        <Head>
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />
          <BarebonesFonts />
        </Head>
        <Preview>Votre classement du {dateLabel}</Preview>
        <Body className="bg-bg-2 dark:bg-bg-2-dark font-sans">
          <Section className="w-full text-center pt-5">
            <Text className="font-16 font-sans text-fg-3 dark:text-fg-3-dark">
              GEO COMPASS
            </Text>
            <Text className="font-13 font-sans text-fg-3 dark:text-fg-3-dark">
              Monitorez votre position dans les résultats LLM
            </Text>
          </Section>
          <Container className="mx-auto w-full max-w-[480px]">
            <Section className="bg-bg dark:bg-bg-dark mb-6 rounded-[10px] px-6">
              <Text className="font-13 mb-1 font-sans text-fg-3 dark:text-fg-3-dark">
                Résultats du jour
              </Text>
              <Heading
                as="h1"
                className="font-32 mt-0 mb-6 font-sans text-fg dark:text-fg-dark"
              >
                {dateLabel}
              </Heading>

              {ranking.length === 0 ? (
                <Text className="font-16 font-sans text-fg-2 dark:text-fg-2-dark">
                  Aucune mention détectée aujourd'hui.
                </Text>
              ) : (
                <Section className="border-stroke-strong dark:border-stroke-strong-dark rounded-[10px] border border-solid">
                  {ranking.map((entry, index) => (
                    <Row
                      key={entry.brand}
                      className={
                        index < ranking.length - 1
                          ? 'border-stroke-strong dark:border-stroke-strong-dark border-0 border-b border-solid'
                          : undefined
                      }
                    >
                      <Column className="font-16 w-10 px-4 py-3 font-sans text-fg-3 dark:text-fg-3-dark">
                        #{entry.rank}
                      </Column>
                      <Column className="font-16 px-4 py-3 font-sans text-fg dark:text-fg-dark">
                        {entry.brand}
                      </Column>
                      <Column
                        align="right"
                        className="font-14 px-4 py-3 text-right font-sans text-fg-2 dark:text-fg-2-dark"
                      >
                        {entry.mentions} mentions
                      </Column>
                    </Row>
                  ))}
                </Section>
              )}

              <Section className="mt-6 text-center">
                <Link
                  href="https://geo-compass-front-end.vercel.app/fr"
                  className="bg-brand dark:bg-brand-dark text-fg-inverted dark:text-fg-inverted-dark font-14 inline-block rounded-[8px] px-5 py-3 font-sans font-semibold no-underline"
                >
                  Voir les résultats dans Geo Compass
                </Link>
              </Section>
            </Section>
            <Section className="text-center px-4 mb-10">
              <Text className="font-13 font-sans text-fg-3 dark:text-fg-3-dark">
                Si vous ne souhaitez plus recevoir ces emails, vous pouvez
                modifier vos paramètres de notifications.
              </Text>
              <Link
                href="https://geo-compass-front-end.vercel.app/fr/settings"
                className="text-brand dark:text-brand-dark underline font-13 font-sans"
              >
                Aller dans mes paramètres
              </Link>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

DailyResultsEmail.PreviewProps = {
  date: new Date('2026-08-01'),
  ranking: [
    { brand: 'Apple', mentions: 10, rank: 1 },
    { brand: 'Google', mentions: 5, rank: 2 },
    { brand: 'Microsoft', mentions: 3, rank: 3 },
    { brand: 'Amazon', mentions: 2, rank: 4 },
    { brand: 'Facebook', mentions: 1, rank: 5 },
  ],
} satisfies DailyResultsEmailProps;

export default DailyResultsEmail;

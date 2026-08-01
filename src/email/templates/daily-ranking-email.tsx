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
          <BarebonesFonts />
        </Head>
        <Preview>Votre classement du {dateLabel}</Preview>
        <Body className="bg-bg-2 m-0 font-sans">
          <Container className="mx-auto mt-8 mobile:mt-0 w-full max-w-[480px]">
            <Section className="bg-bg mb-6 rounded-[10px] px-6 py-8">
              <Text className="font-13 mt-0 mb-1 font-sans text-fg-3">
                Résultats du jour
              </Text>
              <Heading as="h1" className="font-32 mt-0 mb-6 font-sans text-fg">
                {dateLabel}
              </Heading>

              {ranking.length === 0 ? (
                <Text className="font-16 font-sans text-fg-2">
                  Aucune mention détectée aujourd'hui.
                </Text>
              ) : (
                <Section className="border-stroke-strong rounded-[10px] border border-solid">
                  {ranking.map((entry, index) => (
                    <Row
                      key={entry.brand}
                      className={
                        index < ranking.length - 1
                          ? 'border-stroke-strong border-0 border-b border-solid'
                          : undefined
                      }
                    >
                      <Column className="font-16 w-10 px-4 py-3 font-sans text-fg-3">
                        #{entry.rank}
                      </Column>
                      <Column className="font-16 px-4 py-3 font-sans text-fg">
                        {entry.brand}
                      </Column>
                      <Column
                        align="right"
                        className="font-14 px-4 py-3 text-right font-sans text-fg-2"
                      >
                        {entry.mentions} mentions
                      </Column>
                    </Row>
                  ))}
                </Section>
              )}
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

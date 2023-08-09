import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';

import { CodeBlock, EditorHTML } from 'idea-react';
import { textJoin } from 'mobx-i18n';
import { observer } from 'mobx-react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { cache, compose, translator } from 'next-ssr-middleware';
import { FC } from 'react';
import { Container } from 'react-bootstrap';

import { PageHead } from '../components/PageHead';
import { i18n } from '../models/Translation';
import RichEditData from './api/rich-edit.json';

const HTMLEditor = dynamic(() => import('../components/HTMLEditor'), {
  ssr: false,
});
HTMLEditor.displayName = 'HTMLEditor';

const BlockEditor = dynamic(() => import('../components/BlockEditor'), {
  ssr: false,
});
BlockEditor.displayName = 'BlockEditor';

const Example: FC<{ title: string }> = ({ title, children }) => (
  <>
    <h2 className="mt-3">{title}</h2>
    {children}
    <CodeBlock language="tsx">{children}</CodeBlock>
  </>
);

export const getServerSideProps = compose(cache(), translator(i18n));

const ComponentPage = observer(() => {
  const { t } = i18n;

  const title = textJoin(t('component'), t('examples')),
    content = JSON.stringify(RichEditData);

  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/prismjs@1.29.0/themes/prism.min.css"
        />
      </Head>

      <PageHead title={title} />

      <Container>
        <h1 className="my-4 text-center">{title}</h1>

        <Example title="HTML Editor">
          <HTMLEditor defaultValue="Hello, HTML!" onChange={console.log} />
        </Example>

        <Example title="Block Editor">
          <BlockEditor name="content" defaultValue={content} />
        </Example>

        <Example title="Block Editor to HTML">
          <EditorHTML data={content} />
        </Example>
      </Container>
    </>
  );
});

export default ComponentPage;

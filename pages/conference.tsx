import { observer } from 'mobx-react';
import { Container } from 'react-bootstrap';

import { PageHead } from '../components/PageHead';
import { i18n } from '../models/Translation';
import styles from '../styles/Home.module.less';
import { withTranslation } from './api/core';
import Purpose from '../components/conference/Purpose';
import Review from '../components/conference/Review';

export const getServerSideProps = withTranslation();

const { t } = i18n;

const ConferencePage = observer(() => (
  <Container as="main" className={styles.main}>
    <PageHead title="Hello Conference Page!" />

    
    <Purpose />
    <Review />
  </Container>
));

export default ConferencePage;

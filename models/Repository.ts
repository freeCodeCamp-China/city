import { components } from '@octokit/openapi-types';
import { memoize } from 'lodash';
import { Filter, ListModel, Stream, toggle } from 'mobx-restful';
import { averageOf, buildURLData } from 'web-utility';

import { githubClient } from './Base';

type Repository = components['schemas']['minimal-repository'];
export type Organization = components['schemas']['organization-full'];
export type Issue = components['schemas']['issue'];

export interface GitRepository extends Repository {
  issues: Issue[];
  languages?: string[];
}

export interface RepositoryFilter extends Filter<GitRepository> {
  relation: (keyof RepositoryModel['relation'])[];
}

type ReturnMap<T> = {
  [K in keyof T]: T[K] extends (...data: any[]) => Promise<any>
    ? Awaited<ReturnType<T[K]>>
    : T[K] extends (...data: any[]) => any
      ? ReturnType<T[K]>
      : never;
};

export class RepositoryModel extends Stream<GitRepository, RepositoryFilter>(
  ListModel,
) {
  client = githubClient;
  indexKey = 'full_name' as const;

  relation = {
    issues: memoize(async (URI: string) => {
      const { body: issuesList } = await this.client.get<Issue[]>(
        `repos/${URI}/issues?per_page=100`,
      );
      return issuesList!.filter(({ pull_request }) => !pull_request);
    }),
    languages: memoize(async (URI: string) => {
      const { body: languageCount } = await this.client.get<
        Record<string, number>
      >(`repos/${URI}/languages`);

      const languageAverage = averageOf(...Object.values(languageCount!));

      const languageList = Object.entries(languageCount!)
        .filter(([_, score]) => score >= languageAverage)
        .sort(([_, a], [__, b]) => b - a);

      return languageList.map(([name]) => name);
    }),
  };

  async getOneRelation(
    URI: string,
    relation: RepositoryFilter['relation'] = [],
  ) {
    const relationData = await Promise.all(
      relation.map(async key => {
        const value = await this.relation[key](URI);
        return [key, value];
      }),
    );
    return Object.fromEntries(relationData) as ReturnMap<
      RepositoryModel['relation']
    >;
  }

  @toggle('downloading')
  async getOne(URI: string, relation: RepositoryFilter['relation'] = []) {
    const { body } = await this.client.get<Repository>(`repos/${URI}`);

    return (this.currentOne = {
      ...body!,
      ...(await this.getOneRelation(URI, relation)),
    });
  }

  async getRepositoryCount(organization: string) {
    const { body } = await this.client.get<Organization>(
      `orgs/${organization}`,
    );
    return body!.public_repos;
  }

  async *getRepository(
    organization: string,
    relation: RepositoryFilter['relation'] = [],
  ) {
    const per_page = this.pageSize;

    this.totalCount ||= 0;
    this.totalCount += await this.getRepositoryCount(organization);

    for (let page = 1, count = 0; ; page++) {
      const { body: list } = await this.client.get<Repository[]>(
        `orgs/${organization}/repos?${buildURLData({
          type: 'public',
          sort: 'pushed',
          page,
          per_page,
        })}`,
      );
      count += list!.length;

      if (count < page * per_page) break;

      const pageData = await Promise.all(
        list!.map(async ({ full_name, ...item }) => ({
          ...item,
          full_name,
          ...(await this.getOneRelation(full_name, relation)),
        })),
      );
      console.log(pageData);

      yield* pageData as GitRepository[];
    }
  }

  async *openStream({ relation }: RepositoryFilter) {
    yield await this.getOne('freeCodeCamp/chinese', relation);

    yield* this.getRepository('freeCodeCamp-China', relation);
  }
}

export default new RepositoryModel();

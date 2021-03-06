import {
    Chapter,
    ChapterDetails,
    ContentRating,
    HomeSection,
    HomeSectionType,
    LanguageCode,
    Manga,
    MangaUpdates,
    PagedResults,
    SearchRequest,
    Source,
    SourceInfo,
    TagSection,
    TagType,
} from 'paperback-extensions-common'

import { Parser } from './GoldenMangasParser'
import {
    GMRequestManager,
    GMResponse
} from './GoldenMangasHelper'

const GOLDENMANGAS_DOMAIN = 'https://goldenmanga.top'

export const GoldenMangasInfo: SourceInfo = {
    version: '0.6',
    name: 'Golden Mangás',
    description: 'Extension that pulls manga from goldenmanga.top',
    author: 'SuperTx2',
    authorWebsite: 'https://github.com/supertx2',
    icon: 'icon.jpg',
    contentRating: ContentRating.ADULT,
    websiteBaseURL: GOLDENMANGAS_DOMAIN,
    language: LanguageCode.PORTUGUESE,
    sourceTags: [
        {
            text: 'Notifications',
            type: TagType.GREEN,
        },
        {
            text: 'Portuguese',
            type: TagType.GREY,
        },
        {
            text: 'Cloudflare',
            type: TagType.RED,
        },
    ],
}

export class GoldenMangas extends Source {
    private readonly parser: Parser = new Parser();
    readonly headers = {
        'referer': GOLDENMANGAS_DOMAIN,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36',
        'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6,gl;q=0.5',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'content-type': 'text/html; charset=UTF-8',
    };
    readonly requestManager = createRequestManager({
        requestsPerSecond: 3,
        requestTimeout: 15000,
        interceptor: {
            interceptRequest: async (request) => {
                request.headers = this.headers
                return request
            },
            interceptResponse: async (response: GMResponse) => {
                response['fixedData'] = response.data || Buffer.from(createByteArray(response.rawData)).toString()
                return response
            },
        },
    }) as GMRequestManager;

    override getCloudflareBypassRequest() {
        return createRequestObject({
            url: GOLDENMANGAS_DOMAIN,
            method: 'GET',
        })
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {

        const request = createRequestObject({
            url: `${GOLDENMANGAS_DOMAIN}/mangabr/${mangaId}`,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data || response['fixedData'])

        return this.parser.parseMangaDetails($, mangaId)
    }


    async getChapters(mangaId: string): Promise<Chapter[]> {

        const request = createRequestObject({
            url: `${GOLDENMANGAS_DOMAIN}/mangabr/${mangaId}`,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data || response['fixedData'])

        return this.parser.parseChapters($, mangaId)
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {

        const request = createRequestObject({
            url: `${GOLDENMANGAS_DOMAIN}/mangabr/${mangaId}/${chapterId}`,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data || response['fixedData'])

        return this.parser.parseChapterDetails($, mangaId, chapterId)
    }

    async getSearchResults(query: SearchRequest, metadata: { page: number, totalPages: number }): Promise<PagedResults> {

        const page = metadata?.page ?? 1
        if (page == -1) {
            return createPagedResults({ results: [], metadata: { page: -1 } })
        }

        let search = query.title ? `busca=${encodeURI(query.title.replace(' ', '+'))}` : ''

        //We can only search by title or by tags
        if (!search) {
            search = ((query.includedTags?.length ?? 0) > 0) ? `genero=${encodeURI(query.includedTags?.map(t => t.id).join(',') || '')}` : ''
        }

        const request = createRequestObject({
            url: `${GOLDENMANGAS_DOMAIN}/mangabr?${search}&pagina=${page}`,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data || response['fixedData'])

        return this.parser.parseSearchResults($, query, metadata)
    }

    override async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
        const dateToSearch = new Date(time.getFullYear(), time.getMonth(), time.getDate())

        let loadNextPage = true
        let foundIds: string[] = []
        let page = 1
        while (loadNextPage && page <= 20) {
            const response = await this.filterUpdatedMangaGetIds(page, dateToSearch, ids)
            loadNextPage = response.loadNextPage

            if (response.foundIds && response.foundIds.length > 0) {
                foundIds = foundIds.concat(response.foundIds)
            }

            page = page + 1
        }

        if (foundIds.length > 0) {
            mangaUpdatesFoundCallback(createMangaUpdates({
                ids: foundIds,
            }))
        }
    }

    private async filterUpdatedMangaGetIds(page: number, time: Date, ids: string[]) {

        const request = createRequestObject({
            url: `${GOLDENMANGAS_DOMAIN}/index.php?pagina=${page}`,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data || response['fixedData'])

        return this.parser.parseUpdatedMangaGetIds($, time, ids)
    }

    override async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        // Let the app know what the homsections are without filling in the data
        const mostReadMangas = createHomeSection({ id: 'mostReadMangas', title: 'Mangás mais lidos', type: HomeSectionType.featured })
        sectionCallback(mostReadMangas)
        const latestUpdates = createHomeSection({ id: 'latestUpdates', title: 'Últimas Atualizações', view_more: true })
        sectionCallback(latestUpdates)
        const newReleases = createHomeSection({ id: 'newReleases', title: 'Novos mangás', type: HomeSectionType.singleRowLarge })
        sectionCallback(newReleases)

        const request = createRequestObject({
            url: GOLDENMANGAS_DOMAIN,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)

        const $ = this.cheerio.load(response.data || response['fixedData'])

        mostReadMangas.items = this.parser.parseHomePageMostReadMangas($)
        sectionCallback(mostReadMangas)

        latestUpdates.items = this.parser.parseHomePageLatestUpdates($)
        sectionCallback(latestUpdates)

        newReleases.items = this.parser.parseHomePageNewReleases($)
        sectionCallback(newReleases)
    }

    override async getViewMoreItems(homepageSectionId: string, metadata: { page: number, lastPage: boolean }): Promise<PagedResults> {
        const page: number = metadata?.page ?? 1
        let lastPage = metadata?.lastPage ?? false

        if (lastPage || page == -1 || homepageSectionId !== 'latestUpdates') {
            return createPagedResults({ results: [], metadata: { page: -1 } })
        }

        const request = createRequestObject({
            url: `${GOLDENMANGAS_DOMAIN}/index.php?pagina=${page}`,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        const $ = this.cheerio.load(response.data || response['fixedData'])

        const mangas = this.parser.parseHomePageLatestUpdates($)
        lastPage = this.parser.parseIsLastPage($, page)

        return createPagedResults({
            results: mangas,
            metadata: {
                page: page + 1,
                lastPage: lastPage
            }
        })
    }

    override async getTags(): Promise<TagSection[]> {
        const options = createRequestObject({
            url: `${GOLDENMANGAS_DOMAIN}/mangabr?genero`,
            method: 'GET',
        })

        const response = await this.requestManager.schedule(options, 1)
        const $ = this.cheerio.load(response.data || response['fixedData'])

        return this.parser.parseTags($)
    }

}

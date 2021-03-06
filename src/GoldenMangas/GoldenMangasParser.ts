import {
    Manga,
    MangaStatus,
    Chapter,
    ChapterDetails,
    MangaTile,
    SearchRequest,
    LanguageCode,
    TagSection,
    PagedResults,
    Tag,
} from 'paperback-extensions-common'
import entities = require('entities')

const GOLDENMANGAS_DOMAIN = 'https://goldenmanga.top'

export class Parser {

    parseMangaDetails($: CheerioStatic, mangaId: string): Manga {

        const firstColumn = $('div.col-sm-4.text-right > img').first()
        const secondColumn = $('div.col-sm-8').first()

        const title = secondColumn.find('h2').eq(0).text().trim()
        const image = firstColumn.attr('src')
        const status = secondColumn.find('h5:contains(Status) a').text() == 'Completo' ? MangaStatus.COMPLETED : MangaStatus.ONGOING
        const author = secondColumn.find('h5:contains(Autor)').text().trim()
        const artist = secondColumn.find('h5:contains(Artista)').text().trim()
        const rating = Number(secondColumn.find('h2').eq(1).text().replace('#', '').split(' ')[0])

        const genres: Tag[] = []
        for (const genreTag of secondColumn.find('h5').first().find('a').toArray()) {
            const genre = $(genreTag).text().trim()
            const genreRef = $(genreTag).attr('href')

            if (!genreRef) {
                continue
            }

            const idString = /genero=(.*)/gi.exec(genreRef)?.[1]

            if (!idString || !genre) {
                continue
            }

            genres.push({
                id: idString,
                label: this.decodeHTMLEntity(genre),
            })
        }

        const tags: TagSection[] = [createTagSection({ id: '0', label: 'genres', tags: genres.map(g => createTag(g)) })]

        const summary = $('#manga_capitulo_descricao').text().trim()

        return createManga({
            id: mangaId,
            rating: rating,
            titles: [this.decodeHTMLEntity(title)],
            image: image ? (GOLDENMANGAS_DOMAIN + image) : 'https://i.imgur.com/GYUxEX8.png',
            author: this.decodeHTMLEntity(author),
            artist: this.decodeHTMLEntity(artist),
            status: status,
            tags: tags,
            desc: this.decodeHTMLEntity(summary),
        })
    }

    parseChapters($: CheerioStatic, mangaId: string): Chapter[] {
        const chapters: Chapter[] = []

        for (const obj of $('ul#capitulos li.row').toArray()) {
            const $obj = $(obj)
            const firstColumn = $obj.find('a > div.col-sm-5')

            const rawName = firstColumn.text()
            const name = rawName.substring(0, rawName.indexOf('(')).trim()
            const splitedDate = firstColumn.find('span[style]').text().replace('(', '').replace(')', '').trim().split('/').map((i: string) => Number(i))

            let time
            if (splitedDate[2] && splitedDate[1] && splitedDate[0]) {
                time = new Date(splitedDate[2], splitedDate[1] - 1, splitedDate[0])
            } else {
                time = new Date()
            }

            const id = $('a', $(obj)).attr('href')?.replace(`/mangabr/${mangaId}/`, '')
            const chapNum = Number(id)

            // If we parsed a bad ID out, don't include this in our list
            if (!id) {
                continue
            }

            chapters.push(createChapter({
                id: id,
                mangaId: mangaId,
                chapNum: chapNum ?? 0,
                langCode: LanguageCode.BRAZILIAN,
                name: this.decodeHTMLEntity(name),
                time: time,
            }))
        }

        return chapters
    }

    parseChapterDetails($: CheerioStatic, mangaId: string, chapterId: string): ChapterDetails {
        const pages: string[] = []

        // Get all of the pages
        const pagesImgs = $('div.col-sm-12[id^=\'capitulos_images\']:has(img[pag])').first().find('img')

        for (const img of pagesImgs.toArray()) {
            const $img = $(img)
            pages.push(`${GOLDENMANGAS_DOMAIN}${$img.attr('src')}`)
        }

        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: pages,
            longStrip: false,
        })
    }

    parseSearchResults($: CheerioStatic, _query: SearchRequest, metadata: { page: number, totalPages: number }): PagedResults {

        const page = metadata?.page ?? 1
        const mangaTiles: MangaTile[] = []

        // Parse the json context
        for (const manga of $('div.mangas.col-lg-2 a').toArray()) {
            const $manga = $(manga)

            const title = $manga.find('h3').text().trim()
            const id = $manga.attr('href')?.replace('/mangabr/', '')
            const image = $manga.find('img').attr('src')

            if (!title || !id) {
                continue
            }

            mangaTiles.push(createMangaTile({
                id: id,
                title: createIconText({ text: this.decodeHTMLEntity(title) }),
                image: image ? (GOLDENMANGAS_DOMAIN + image) : 'https://i.imgur.com/GYUxEX8.png'
            }))
        }

        const pages = $('.pagination li')
        const totalPages = Number(pages.eq(pages.length - 2).text().trim() || 1)

        return createPagedResults({
            results: mangaTiles,
            metadata: {
                page: page + 1 > totalPages ? -1 : page + 1,
                totalPages: totalPages,
            },
        })

    }

    parseUpdatedMangaGetIds($: CheerioStatic, time: Date, ids: string[]): { foundIds: string[], loadNextPage: boolean } {
        const foundIds: string[] = []
        let loadNextPage = true

        const context = $('#response .atualizacao')
        for (const obj of context.toArray()) {
            const $obj = $(obj)
            const id = $obj.find('a').first().attr('href')?.replace('/mangabr/', '')

            if (!id) {
                continue
            }

            const updateTimeSplied = $obj.find('.dataAtualizacao').text()?.trim()?.split('/').map((i: string) => Number(i))

            if (!updateTimeSplied || updateTimeSplied.length !== 3) {
                continue
            }

            if (!updateTimeSplied[2] || !updateTimeSplied[1] || !updateTimeSplied[0]) {
                continue
            }

            const updateTime = new Date(updateTimeSplied[2], updateTimeSplied[1] - 1, updateTimeSplied[0])

            if (updateTime >= time && ids.includes(id)) {
                foundIds.push(id)
            } else {
                loadNextPage = false
                break
            }
        }

        return { foundIds: foundIds, loadNextPage: loadNextPage }
    }

    parseHomePageMostReadMangas = ($: CheerioStatic): MangaTile[] => {
        const popularMangas: MangaTile[] = []

        const context = $('div#maisLidos div.itemmanga')
        for (const obj of context.toArray()) {
            const $obj = $(obj)
            const img = $('img', $(obj)).attr('src')
            const id = $obj.attr('href')?.replace('/mangabr/', '')
            const title = $obj.find('h3').text().trim()
            let chapter = $obj.find('.maisLidosCapitulos a').first().text().trim()

            if (!id || !title) {
                continue
            }

            if (chapter) {
                chapter = `Cap. ${chapter}`
            }

            popularMangas.push(createMangaTile({
                id: id,
                title: createIconText({ text: this.decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: this.decodeHTMLEntity(chapter) }),
                image: img ? (GOLDENMANGAS_DOMAIN + img) : 'https://i.imgur.com/GYUxEX8.png'
            }))
        }

        return popularMangas
    }

    parseHomePageLatestUpdates = ($: CheerioStatic): MangaTile[] => {
        const popularMangas: MangaTile[] = []

        const context = $('#response .atualizacao')
        for (const obj of context.toArray()) {
            const $obj = $(obj)
            const img = $('img', $(obj)).attr('src')
            const id = $obj.find('a').first().attr('href')?.replace('/mangabr/', '')
            const title = $obj.find('h3').text().trim()

            if (!id || !title) {
                continue
            }

            let latestChapter = $obj.find('.label-success').first().text().trim()

            if (latestChapter) {
                latestChapter = `Cap. ${latestChapter}`
            }

            popularMangas.push(createMangaTile({
                id: id,
                title: createIconText({ text: this.decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: this.decodeHTMLEntity(latestChapter) }),
                image: img ? GOLDENMANGAS_DOMAIN + img : 'https://i.imgur.com/GYUxEX8.png',
            }))
        }

        return popularMangas
    }

    parseHomePageNewReleases = ($: CheerioStatic): MangaTile[] => {
        const popularMangas: MangaTile[] = []

        const context = $('.manga-novo .row')
        for (const obj of context.toArray()) {
            const $obj = $(obj)
            const img = $('img', $(obj)).attr('src')
            const id = $obj.find('a').first().attr('href')?.replace('/mangabr/', '')
            const title = $obj.find('h2').text().trim()
            const synopsis = $obj.find('span').text().trim()

            if (!id || !title) {
                continue
            }

            let tags = $obj.parent()?.find('.label-warning').toArray().map((l) => $(l).text()) || []

            if (tags.length > 5) {
                tags = tags.slice(0, 5)
                tags.push('...')
            }

            popularMangas.push(createMangaTile({
                id: id,
                primaryText: createIconText({ text: this.decodeHTMLEntity(synopsis) }),
                title: createIconText({ text: this.decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: this.decodeHTMLEntity(tags.join(', ')) }),
                image: img ? (GOLDENMANGAS_DOMAIN + img) : 'https://i.imgur.com/GYUxEX8.png',
            }))
        }

        return popularMangas
    }

    parseTags($: CheerioStatic): TagSection[] {

        const genres: Tag[] = []
        for (const obj of $('.container').eq(4).find('a.btn-warning').toArray()) {
            const $obj = $(obj)

            const id = $obj.attr('href')?.replace('/mangabr?genero=,', '')
            const tagName = $obj.text().trim()
            if (!id || !tagName) {
                continue
            }

            genres.push(createTag({
                id: id,
                label: this.decodeHTMLEntity(tagName),
            }))
        }

        return [createTagSection({
            id: 'Genero',
            label: 'Genero',
            tags: genres,
        })]
    }

    parseIsLastPage($: CheerioStatic, curPage: number): boolean {
        const pages = $('.pagination li')
        if (!pages.length) {
            return false
        }

        const maxPages = Number(pages.eq(pages.length - 2).text().trim()) || 0
        return !maxPages || curPage >= maxPages
    }

    protected decodeHTMLEntity(str: string): string {
        return entities.decodeHTML(str)
    }

}

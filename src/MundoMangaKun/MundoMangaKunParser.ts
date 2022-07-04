import {
    Manga,
    MangaStatus,
    Chapter,
    ChapterDetails,
    MangaTile,
    LanguageCode,
    PagedResults,
    Response,
    Tag,
    TagSection
} from 'paperback-extensions-common'
import entities = require('entities')

const BASE_DOMAIN = 'https://mundomangakun.com.br'

export class Parser {

    parseMangaDetails($: CheerioStatic, mangaId: string): Manga {

        const $infoElement = $('.main_container_projeto .container-fluid')
        const $infoText = $infoElement.find('.tabela_info_projeto tr')
        const title = $infoElement.find('.titulo_projeto').first().text().trim()
        const image = $infoElement.find('.imagens_projeto_container img').attr('src')
        const status = $infoText.eq(5).find('td').eq(1).text() == 'Em Andamento' ? MangaStatus.ONGOING : MangaStatus.COMPLETED
        const author = $infoElement.find('.tabela_info_projeto tr').eq(1).find('td').eq(1).text()
        const artist = $infoElement.find('.tabela_info_projeto tr').eq(0).find('td').eq(1).text()

        const genres: Tag[] = []
        $infoElement.find('.generos a').filter((_: number, e: CheerioElement) => !!$(e).text()).toArray().map((e: CheerioElement) => {
            const id = $(e).text().trim()
                , details = id

            if(!id || !details) {
                return
            }

            genres.push({
                id: id
                , label: this.decodeHTMLEntity(details)
            })
        })
        const tags: TagSection[] = [createTagSection({id: 'genres', label: 'genres', tags: genres.map(g => createTag(g))})]

        const summary = $infoElement.find('.conteudo_projeto').text().trim()

        return createManga({
            id: mangaId,
            titles: [this.decodeHTMLEntity(title)],
            image: image ? image : 'https://i.imgur.com/GYUxEX8.png',
            author: this.decodeHTMLEntity(author),
            artist: this.decodeHTMLEntity(artist),
            status: status,
            tags: tags,
            desc: this.decodeHTMLEntity(summary),
        })
    }

    parseChapters($: CheerioStatic, mangaId: string): Chapter[] {

        const chapters: Chapter[] = []

        for (const obj of $('.capitulos_leitor_online a').toArray()) {
            const $obj = $(obj)

            const name = $obj.text()

            const clickEvent = $obj.attr('onclick')
            const id = clickEvent?.substring(clickEvent.indexOf(mangaId), clickEvent.indexOf('\',\'tipo\'')).replaceAll('\\', '').replace(`${mangaId}/`, '').split('/')[0]
            const chapNum = Number(name.replace('Capítulo ', '')) ?? 0

            // If we parsed a bad ID out, don't include this in our list
            if (!id) {
                continue
            }

            chapters.push(createChapter({
                id: id,
                mangaId: mangaId,
                chapNum: chapNum,
                langCode: LanguageCode.BRAZILIAN,
                name: this.decodeHTMLEntity(name),
            }))
        }

        return chapters
    }

    parseChapterDetails(data: Response, mangaId: string, chapterId: string): ChapterDetails {

        let pagesString = data.data
        const pagesStartIndex = pagesString.indexOf('var paginas = ')
        pagesString = pagesString.substring(pagesStartIndex, pagesString.length - 1)
        pagesString = pagesString.substring(0, pagesString.indexOf(']') + 1).replace('var paginas = ', '')

        let pagesObject
        try {
            pagesObject = JSON.parse(pagesString)
        } catch {
            pagesObject = []
        }

        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: pagesObject,
            longStrip: false,
        })
    }

    parseSearchResults($: CheerioStatic): PagedResults {
        const mangaTiles: MangaTile[] = []

        for (const manga of $('.leitor_online_container article').toArray()) {
            const $manga = $(manga)
            const $titleA = $manga.find('.titulo_manga_item a')
            const title = $titleA.text()
            const id = $titleA.attr('href')?.replace(`${BASE_DOMAIN}/projeto/`, '').replace('/', '')
            const image = $manga.find('.container_imagem').css('background-image').slice(4, -1).replace(/"/g, '')

            if (!id || !title) {
                continue
            }

            mangaTiles.push(createMangaTile({
                id: id,
                title: createIconText({ text: this.decodeHTMLEntity(title) }),
                image: image ? image : 'https://i.imgur.com/GYUxEX8.png',
            }))

        }

        const paging = $('.paginacao')
        const page = Number(paging.find('.current').text()) ?? 1
        const totalPages = Number(paging.find('.page-numbers:not(.next)').last().text()) ?? 1

        return createPagedResults({
            results: mangaTiles,
            metadata: {
                page: page + 1 > totalPages ? -1 : page + 1,
                totalPages: totalPages,
            },
        })

    }

    parseHomePageSections($: CheerioStatic): MangaTile[] {
        const popularMangas: MangaTile[] = []

        const context = $('.lancamentos_main_container .container-obras-populares article')
        for (const obj of context.toArray()) {
            const $obj = $(obj)
            const img = $obj.find('.container_imagem').css('background-image').slice(4, -1).replace(/"/g, '')
            const titleLink = $('a', $(obj)).attr('href')
            const id = titleLink?.replace('https://mundomangakun.com.br/projeto/', '').replace('/', '')
            const title = id?.replaceAll('-', ' ').toLowerCase().replace(/\b[a-z]/g, (letter: string) => {
                return letter.toUpperCase()
            })

            if (!id || !title) {
                continue
            }

            let foundItem = false
            for (const item of popularMangas) {
                if (item.id == id) {
                    foundItem = true
                    break
                }
            }

            if (foundItem) {
                continue
            }
            let chapter = this.decodeHTMLEntity($obj.find('.post-projeto-cap').text().trim())

            if (chapter) {
                chapter = `Cap. ${chapter}`
            }

            popularMangas.push(createMangaTile({
                id: id,
                title: createIconText({ text: this.decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: chapter }),
                image: img ? img : 'https://i.imgur.com/GYUxEX8.png',
            }))
        }

        return popularMangas
    }

    parseHomePageNewReleases = ($: CheerioStatic): MangaTile[] => {
        const popularMangas: MangaTile[] = []

        const context = $('.post-projeto')
        for (const obj of context.toArray()) {
            const $obj = $(obj)
            const img = $obj.find('.post-projeto-background').css('background-image').slice(4, -1).replace(/"/g, '')
            const titleLink = $('a', $(obj)).attr('href')
            //url example: https://mundomangakun.com.br/leitor-online/projeto/building-owner/cap-tulo-51/#todas-as-paginas
            let id = titleLink?.replace('https://mundomangakun.com.br/leitor-online/projeto/', '')
            const title = $obj.find('.titulo-cap').contents().eq(0).text().trim()
            const chapter = $obj.find('.titulo-cap small').text().trim()

            if (!id || !title) {
                continue
            }

            //We only need the project name, we remove the rest
            id = id.substring(0, id.indexOf('/')).trim()

            popularMangas.push(createMangaTile({
                id: id,
                title: createIconText({ text: this.decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: this.decodeHTMLEntity(chapter) }),
                image: img ? img : 'https://i.imgur.com/GYUxEX8.png',
            }))
        }

        return popularMangas
    }

    getTags(): TagSection[] {
        const genres: Tag[] = []

        for(const genre of Object.keys(this.getGenres())) {
            genres.push(createTag({
                id: genre,
                label: this.decodeHTMLEntity(genre),
            }))
        }

        return [createTagSection({
            id: 'Genero',
            label: 'Genero',
            tags: genres,
        })]
    }

    getGenres(): { [key: string]: number } {
        return {
            'Ação': 59,
            'Adulto': 63,
            'Artes Marciais': 77,
            'Aventura': 65,
            'Comédia': 30,
            'Drama': 17,
            'Ecchi': 74,
            'Escolar': 64,
            'Esportes': 87,
            'Fantasia': 31,
            'Gyaru': 681,
            'Harem': 82,
            'hentai': 525,
            'Histórico': 95,
            'Josei': 553,
            'Mistério': 19,
            'Oneshot': 527,
            'Peitões': 680,
            'Psicológico': 20,
            'Romance': 75,
            'Sci-fi': 66,
            'Seinen': 61,
            'Serial Killer': 93,
            'Shoujo': 568,
            'Shoujo Ai': 92,
            'Shounen': 67,
            'Slice Of Life': 94,
            'Sobrenatural': 76,
            'Sobrevivência': 90,
            'Super Poderes': 425,
            'Supernatual': 60,
            'Suspense': 520,
            'Terror': 18,
            'Tragédia': 21,
            'Virgem': 682,
            'yuri': 526,
        }
    }

    protected decodeHTMLEntity(str: string): string {
        return entities.decodeHTML(str)
    }
}

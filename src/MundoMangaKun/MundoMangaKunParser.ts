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
            const id = $(e).attr('href')?.replace(`${mangaId}/generos/`, '').replace('/', '/')
                , details = $(e).text().trim()

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

        return createPagedResults({
            results: mangaTiles,
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

    protected decodeHTMLEntity(str: string): string {
        return entities.decodeHTML(str)
    }
}

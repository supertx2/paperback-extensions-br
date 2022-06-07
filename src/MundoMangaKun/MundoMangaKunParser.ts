import {
	Source,
	Manga,
	MangaStatus,
	Chapter,
	ChapterDetails,
	HomeSection,
	MangaTile,
	SearchRequest,
	LanguageCode,
	TagSection,
	PagedResults,
	SourceInfo,
	Tag, ContentRating, TagType
} from "paperback-extensions-common"

const BASE_DOMAIN = 'https://mundomangakun.com.br'
const method = 'GET'

export class Parser {


	parseMangaDetails($:any, mangaId: string): Manga {

		const $infoElement = $(".main_container_projeto .container-fluid");
		const $infoText = $infoElement.find(".tabela_info_projeto tr");
		const titles = [$infoElement.find(".titulo_projeto").first().text().trim()];
		const image = $infoElement.find('.imagens_projeto_container img').attr('src');
		const status = $infoText.eq(5).find('td').eq(1).text() == "Em Andamento" ? MangaStatus.ONGOING : MangaStatus.COMPLETED;
		const author = $infoElement.find(".tabela_info_projeto tr").eq(1).find('td').eq(1).text();
		const artist = $infoElement.find(".tabela_info_projeto tr").eq(0).find('td').eq(1).text();

		const genres: Tag[] = [];
		$infoElement.find(".generos a").filter((i, e) => !!$(e).text()).toArray().map(e => genres.push({
			id: $(e).attr('href')?.replace(`${mangaId}/generos/`, '').replace('/', '/')!
			, label: $(e).text().trim()
		}));

		let tags: TagSection[] = [createTagSection({ id: 'genres', label: 'genres', tags: genres })]

		let summary = $infoElement.find(".conteudo_projeto").text().trim()

		return createManga({
			id: mangaId,
			rating: 1,//unknown
			views: 1,
			titles: titles,
			image: `${image!}`,
			author: author,
			artist: artist,
			status: Number(status),
			// tags: tags,
			desc: summary
		})
	}


	parseChapters($: any, mangaId: string): Chapter[] {

		let chapters: Chapter[] = []

		for (let obj of $(".capitulos_leitor_online a").toArray()) {
			const $obj = $(obj);

			const name = $obj.text();

			const clickEvent = $obj.attr("onclick");
			const id = clickEvent?.substring(clickEvent.indexOf(mangaId), clickEvent.indexOf(`','tipo'`)).replaceAll('\\', '').replace(`${mangaId}/`, '').split('/')[0];
			let chapNum = Number(name.replace(/\D/g, ''));

			// If we parsed a bad ID out, don't include this in our list
			if (!id) {
				continue
			}

			chapters.push(createChapter({
				id: id,
				mangaId: mangaId,
				chapNum: chapNum,
				langCode: LanguageCode.BRAZILIAN,
				name: name,
			}))
		}

		return chapters
	}


	parseChapterDetails(data: any, mangaId: string, chapterId: string): ChapterDetails {

		let pagesString = data.data
		const pagesStartIndex = pagesString.indexOf("var paginas = ");
		pagesString = pagesString.substring(pagesStartIndex, pagesString.length -1)
		pagesString = pagesString.substring(0, pagesString.indexOf(']') + 1).replace('var paginas = ','');
		const pagesObject = JSON.parse(pagesString)

		return createChapterDetails({
			id: chapterId,
			mangaId: mangaId,
			pages: pagesObject,
			longStrip: false
		})
	}

	parseSearchResults($: any, query: SearchRequest, metadata: any): PagedResults {
		let mangaTiles: MangaTile[] = []

		for (let manga of $(".leitor_online_container article").toArray()) {
			const $manga = $(manga);

			const $titleA = $manga.find(".titulo_manga_item a");
			const title = $titleA.text();
			const id = $titleA.attr("href")?.replace(`${BASE_DOMAIN}/projeto/`, '').replace('/', '');
			const image = $manga.find('.container_imagem').css('background-image').slice(4, -1).replace(/"/g, "");
			mangaTiles.push(createMangaTile({
				id: id!,
				title: createIconText({ text: title }),
				image: `${image!}`
			}))

		}

		return createPagedResults({
			results: mangaTiles
		})

	}

	parseHomePageSections($: any): MangaTile[] {
		let popularMangas: MangaTile[] = []

		const context = $(".lancamentos_main_container .container-obras-populares article");
		for (let obj of context.toArray()) {
			const $obj = $(obj);
			let img = $obj.find('.container_imagem').css('background-image').slice(4, -1).replace(/"/g, "");
			const titleLink = $('a', $(obj)).attr('href')!;
			let id = titleLink.replace('https://mundomangakun.com.br/projeto/', '').replace('/', '');
			const title = id.replaceAll('-', ' ').toLowerCase().replace(/\b[a-z]/g, function (letter) {
				return letter.toUpperCase();
			});

			// If there was not a valid ID parsed, skip this entry
			if (!id) {
				continue
			}

			let foundItem = false
			for (let item of popularMangas) {
				if (item.id == id) {
					foundItem = true
					break
				}
			}

			if (foundItem) {
				continue
			}

			popularMangas.push(createMangaTile({
				id: id,
				title: createIconText({ text: title }),
				image: img
			}))
		}

		return popularMangas
	}
}
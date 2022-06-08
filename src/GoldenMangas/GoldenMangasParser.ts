import {
	Source,
	Manga,
	MangaStatus,
	Chapter,
	ChapterDetails,
	HomeSection,
	MangaTile,
	ContentRating,
	SearchRequest,
	LanguageCode,
	TagSection,
	PagedResults,
	SourceInfo,
	Tag, TagType, MangaUpdates,
} from 'paperback-extensions-common';

const GOLDENMANGAS_DOMAIN = 'https://goldenmanga.top';

export class Parser {

	parseMangaDetails($: any, mangaId: string): Manga {

		let manga: Manga[] = [];
		const infoElement = $('div.row > div.col-sm-8 > div.row').first();
		const firstColumn = $('div.col-sm-4.text-right > img').first();
		const secondColumn = $('div.col-sm-8').first();


		const titles = [secondColumn.find('h2').eq(0).text().trim()];
		const image = firstColumn.attr('src');
		const status = secondColumn.find('h5:contains(Status) a').text() == 'Completo' ? MangaStatus.COMPLETED : MangaStatus.ONGOING;
		const author = secondColumn.find('h5:contains(Autor)')!!.text();
		const artist = secondColumn.find('h5:contains(Artista)')!!.text();
		const rating = Number(secondColumn.find('h2').eq(1).text().replace('#', '').split(' ')[0]);

		let genres: Tag[] = [];
		secondColumn.find('h5').first().find('a').filter((i, e) => !!$(e).text()).toArray().map(e => {
			const idString = $(e).attr('href').replace('..', '').replace('/mangabr?genero=', '');
			if (!idString)
				return;
			genres.push({
				id: idString
				, label: $(e).text().trim(),
			});
		});

		let tags: TagSection[] = [createTagSection({id: '0', label: 'genres', tags: genres.map(g => createTag(g))})];

		let summary = $('#manga_capitulo_descricao').text().trim();

		return createManga({
			id: mangaId,
			rating: rating,
			titles: titles,
			image: `${GOLDENMANGAS_DOMAIN}${image!}`,
			author: author,
			artist: artist,
			status: Number(status),
			tags: tags, //It's making the app to crash
			desc: summary,
		});
	}

	parseChapters($: any, mangaId: string): Chapter[] {
		let chapters: Chapter[] = [];

		for (let obj of $('ul#capitulos li.row').toArray()) {
			const $obj = $(obj);
			const firstColumn = $obj.find('a > div.col-sm-5');
			const secondColumn = $obj.find('div.col-sm-5.text-right a[href^=\'http\']');

			const rawName = firstColumn.text();
			const name = rawName.substring(0, rawName.indexOf('(')).trim();
			const splitedDate = firstColumn.find('span[style]').text().replace('(', '').replace(')', '').trim().split('/').map(i => Number(i));

			let time = new Date(splitedDate[2], splitedDate[1] - 1, splitedDate[0]);

			let id = $('a', $(obj)).attr('href')?.replace(`/mangabr/${mangaId}/`, '');
			let chapNum = Number(id) || 0;

			// If we parsed a bad ID out, don't include this in our list
			if (!id) {
				continue;
			}

			chapters.push(createChapter({
				id: id,
				mangaId: mangaId,
				chapNum: chapNum,
				langCode: LanguageCode.BRAZILIAN,
				name: name,
				time: time,
			}));
		}

		return chapters;
	}

	parseChapterDetails($: any, mangaId: string, chapterId: string): ChapterDetails {
		let pages: string[] = [];

		// Get all of the pages
		let pagesImgs = $('div.col-sm-12[id^=\'capitulos_images\']:has(img[pag])').first().find('img');

		for (let img of pagesImgs.toArray()) {
			const $img = $(img);
			pages.push(`${GOLDENMANGAS_DOMAIN}${$img.attr('src')}`);
		}

		return createChapterDetails({
			id: chapterId,
			mangaId: mangaId,
			pages: pages,
			longStrip: false,
		});
	}

	parseSearchResults($: any, query: SearchRequest, metadata: any): PagedResults {

		const page = metadata?.page ?? 1;
		let mangaTiles: MangaTile[] = [];

		// Parse the json context
		for (let manga of $('div.mangas.col-lg-2 a').toArray()) {
			const $manga = $(manga);

			const title = $manga.find('h3').text();
			const id = $manga.attr('href')?.replace('/mangabr/', '');
			const image = $manga.find('img').attr('src');
			mangaTiles.push(createMangaTile({
				id: id!,
				title: createIconText({text: title}),
				image: `${GOLDENMANGAS_DOMAIN}${image!}`,
			}));

		}

		const pages = $('.pagination li');
		const totalPages = Number(pages.eq(pages.length - 2).text().trim() || 1);
		//console.log("[Debug] Total Pages: " + totalPages);
		// Because we're reading JSON, there will never be another page to search through
		return createPagedResults({
			results: mangaTiles,
			metadata: {
				page: page + 1 > totalPages ? -1 : page + 1,
				totalPages: totalPages,
			},
		});

	}

	parseUpdatedMangaGetIds($: any, page: number, time: Date, ids: string[]) {

		let foundIds: string[] = [];
		let loadNextPage = true;
		let context = $('#response .atualizacao');
		for (let obj of context.toArray()) {
			const $obj = $(obj);
			let id = $obj.find('a').first().attr('href')?.replace('/mangabr/', '');

			const updateTimeSplied = $obj.find('.dataAtualizacao').text()?.trim()?.split('/').map(i => Number(i));
			let updateTime: Date;
			if (!updateTimeSplied || updateTimeSplied.length !== 3)
				continue;

			updateTime = new Date(updateTimeSplied[2], updateTimeSplied[1] - 1, updateTimeSplied[0]);

			if (updateTime >= time) {
				if (ids.includes(id))
					foundIds.push(id);
			} else {
				loadNextPage = false;
				break;
			}
		}

		return {foundIds: foundIds, loadNextPage: loadNextPage};
	}

	parseHomePageMostReadMangas = ($): MangaTile[] => {
		let popularMangas: MangaTile[] = [];

		let context = $('div#maisLidos div.itemmanga');
		for (let obj of context.toArray()) {
			const $obj = $(obj);
			let img = `${GOLDENMANGAS_DOMAIN}${$('img', $(obj)).attr('src')}`;
			let id = $obj.attr('href')?.replace('/mangabr/', '');
			let title = $obj.find('h3').text().trim();

			if (!id) {
				continue;
			}

			popularMangas.push(createMangaTile({
				id: id,
				title: createIconText({text: title}),
				image: img,
			}));
		}

		return popularMangas;
	};

	parseHomePageLatestUpdates = ($): MangaTile[] => {
		let popularMangas: MangaTile[] = [];

		let context = $('#response .atualizacao');
		for (let obj of context.toArray()) {
			const $obj = $(obj);
			let img = `${GOLDENMANGAS_DOMAIN}${$('img', $(obj)).attr('src')}`;
			let id = $obj.find('a').first().attr('href')?.replace('/mangabr/', '');
			let title = $obj.find('h3').text().trim();

			if (!id) {
				continue;
			}

			popularMangas.push(createMangaTile({
				id: id,
				title: createIconText({text: title}),
				image: img,
			}));
		}

		return popularMangas;
	};

	parseHomePageNewReleases = ($): MangaTile[] => {
		let popularMangas: MangaTile[] = [];

		let context = $('.manga-novo .row');
		for (let obj of context.toArray()) {
			const $obj = $(obj);
			let img = `${GOLDENMANGAS_DOMAIN}${$('img', $(obj)).attr('src')}`;
			let id = $obj.find('a').first().attr('href')?.replace('/mangabr/', '');
			let title = $obj.find('h2').text().trim();
			let synopsis = $obj.find('span').text().trim();
			if (!id) {
				continue;
			}

			popularMangas.push(createMangaTile({
				id: id,
				primaryText: createIconText({text: synopsis}),//Todo: Check the best place to put the synopsis
				title: createIconText({text: title}),
				image: img,
			}));
		}

		return popularMangas;
	};

	parseTags($: any): TagSection[] {

		const genres: Tag[] = [];
		for (const obj of $('.container').eq(4).find('a.btn-warning').toArray()) {
			const $obj = $(obj);

			const id = $obj.attr('href').replace('/mangabr?genero=,', '');
			genres.push(createTag({
				id: id,
				label: $(obj).text().trim(),
			}));
		}

		return [createTagSection({
			id: 'Genero',
			label: 'Genero',
			tags: genres,
		})];
	}

}

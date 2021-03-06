// @ts-nocheck

import cheerio from 'cheerio'
import {APIWrapper, SearchRequest, Source} from 'paperback-extensions-common';
import { MundoMangaKun as MundoMangaKun } from '../MundoMangaKun/MundoMangaKun';
import axios from 'axios';

describe('GoldenMangas Tests', function () {

    var wrapper: APIWrapper = new APIWrapper();
    var source: Source = new MundoMangaKun(cheerio);
    var chai = require('chai'), expect = chai.expect, should = chai.should();
    var chaiAsPromised = require('chai-as-promised');
    chai.use(chaiAsPromised);

    /**
     * The Manga ID which this unit test uses to base it's details off of.
     * Try to choose a manga which is updated frequently, so that the historical checking test can
     * return proper results, as it is limited to searching 30 days back due to extremely long processing times otherwise.
     */
    var mangaId = "gleipnir";

    it("Retrieve Manga Details", async () => {
        let details = await wrapper.getMangaDetails(source, mangaId);
        expect(details, "No results found with test-defined ID [" + mangaId + "]").to.exist;
        // Validate that the fields are filled
        let data = details;
        // expect(data.id, "Missing ID").to.be.not.empty;
        expect(data.image, "Missing Image").to.be.not.empty;
        expect(data.status, "Missing Status").to.exist;
        expect(data.desc, "Missing Description").to.be.not.empty;
        expect(data.titles, "Missing Titles").to.be.not.empty;
        expect(data.rating, "Missing Rating").to.exist;
    });

    it("Get Chapters", async () => {
        let data = await wrapper.getChapters(source, mangaId);

        expect(data, "No chapters present for: [" + mangaId + "]").to.not.be.empty;

        let entry = data[0]
        expect(entry.id, "No ID present").to.not.be.empty;
        // expect(entry.time, "No date present").to.exist
        expect(entry.name, "No title available").to.not.be.empty
        expect(entry.chapNum, "No chapter number present").to.not.be.null
    });

    it("Get Chapter Details", async () => {
        let chapters = await wrapper.getChapters(source, mangaId);

        let data = await wrapper.getChapterDetails(source, "a-perverts-daily-life", "cap-tulo-83-50");

        expect(data, "No server response").to.exist;
        expect(data, "Empty server response").to.not.be.empty;
        expect(data.id, "Missing ID").to.be.not.empty;
        expect(data.mangaId, "Missing MangaID").to.be.not.empty;
        expect(data.pages, "No pages present").to.be.not.empty;
    });

    it("Testing search", async () => {
        let testSearch: SearchRequest = {
            title: "gleipnir",
            parameters: {}
        };

        let search = await wrapper.searchRequest(source, testSearch);
        let result = search.results[0];

        expect(result, "No response from server").to.exist;

        expect(result.id, "No ID found for search query").to.be.not.empty;
        expect(result.image, "No image found for search").to.be.not.empty;
        expect(result.title, "No title").to.be.not.null;
        expect(result.subtitleText, "No subtitle text").to.be.not.null;
    });

    it("Testing Home-Page aquisition", async () => {
        let homePages = await wrapper.getHomePageSections(source)
        expect(homePages, "No response from server").to.exist
        expect(homePages[0].items, "No items present").to.exist

        // Ensure that we can resolve each of the images for the home-page, since these images are generated and not scraped
        for (let obj of homePages[0].items ?? []) {
            let axios = require('axios')
            let imageResult = await axios.get(obj.image)
            expect(imageResult.status).to.equal(200)    // Good resolve!
        }
    })

	it("Testing View More aquisition", async () => {
        let titles = await wrapper.getViewMoreItems(source, 'newReleases', {})
        expect(titles, "No response from server").to.exist
        expect(titles[0].items, "No items present").to.exist

        // Ensure that we can resolve each of the images for the home-page, since these images are generated and not scraped
        for (let obj of titles[0].items ?? []) {
            let axios = require('axios')
            let imageResult = await axios.get(obj.image)
            expect(imageResult.status).to.equal(200)    // Good resolve!
        }
    })

});

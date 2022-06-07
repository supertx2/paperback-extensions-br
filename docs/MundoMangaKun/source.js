(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlEncodeObject = exports.convertTime = exports.Source = void 0;
class Source {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
    /**
     * @deprecated use {@link Source.getSearchResults getSearchResults} instead
     */
    searchRequest(query, metadata) {
        return this.getSearchResults(query, metadata);
    }
    /**
     * @deprecated use {@link Source.getSearchTags} instead
     */
    getTags() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            return (_a = this.getSearchTags) === null || _a === void 0 ? void 0 : _a.call(this);
        });
    }
}
exports.Source = Source;
// Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
function convertTime(timeAgo) {
    var _a;
    let time;
    let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('minutes')) {
        time = new Date(Date.now() - trimmed * 60000);
    }
    else if (timeAgo.includes('hours')) {
        time = new Date(Date.now() - trimmed * 3600000);
    }
    else if (timeAgo.includes('days')) {
        time = new Date(Date.now() - trimmed * 86400000);
    }
    else if (timeAgo.includes('year') || timeAgo.includes('years')) {
        time = new Date(Date.now() - trimmed * 31556952000);
    }
    else {
        time = new Date(Date.now());
    }
    return time;
}
exports.convertTime = convertTime;
/**
 * When a function requires a POST body, it always should be defined as a JsonObject
 * and then passed through this function to ensure that it's encoded properly.
 * @param obj
 */
function urlEncodeObject(obj) {
    let ret = {};
    for (const entry of Object.entries(obj)) {
        ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
    }
    return ret;
}
exports.urlEncodeObject = urlEncodeObject;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tracker = void 0;
class Tracker {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
}
exports.Tracker = Tracker;

},{}],4:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);
__exportStar(require("./Tracker"), exports);

},{"./Source":2,"./Tracker":3}],5:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);
__exportStar(require("./APIWrapper"), exports);

},{"./APIWrapper":1,"./base":4,"./models":47}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],7:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],8:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],9:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],10:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],11:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],12:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],13:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],14:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],15:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],16:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],17:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],18:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],19:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],20:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],21:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],22:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],23:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],24:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Button"), exports);
__exportStar(require("./Form"), exports);
__exportStar(require("./Header"), exports);
__exportStar(require("./InputField"), exports);
__exportStar(require("./Label"), exports);
__exportStar(require("./Link"), exports);
__exportStar(require("./MultilineLabel"), exports);
__exportStar(require("./NavigationButton"), exports);
__exportStar(require("./OAuthButton"), exports);
__exportStar(require("./Section"), exports);
__exportStar(require("./Select"), exports);
__exportStar(require("./Switch"), exports);
__exportStar(require("./WebViewButton"), exports);
__exportStar(require("./FormRow"), exports);
__exportStar(require("./Stepper"), exports);

},{"./Button":9,"./Form":11,"./FormRow":10,"./Header":12,"./InputField":13,"./Label":14,"./Link":15,"./MultilineLabel":16,"./NavigationButton":17,"./OAuthButton":18,"./Section":19,"./Select":20,"./Stepper":21,"./Switch":22,"./WebViewButton":23}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeSectionType = void 0;
var HomeSectionType;
(function (HomeSectionType) {
    HomeSectionType["singleRowNormal"] = "singleRowNormal";
    HomeSectionType["singleRowLarge"] = "singleRowLarge";
    HomeSectionType["doubleRow"] = "doubleRow";
    HomeSectionType["featured"] = "featured";
})(HomeSectionType = exports.HomeSectionType || (exports.HomeSectionType = {}));

},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],27:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],28:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
    MangaStatus[MangaStatus["UNKNOWN"] = 2] = "UNKNOWN";
    MangaStatus[MangaStatus["ABANDONED"] = 3] = "ABANDONED";
    MangaStatus[MangaStatus["HIATUS"] = 4] = "HIATUS";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],30:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],31:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],32:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],33:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],34:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],35:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],36:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],37:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchOperator = void 0;
var SearchOperator;
(function (SearchOperator) {
    SearchOperator["AND"] = "AND";
    SearchOperator["OR"] = "OR";
})(SearchOperator = exports.SearchOperator || (exports.SearchOperator = {}));

},{}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentRating = void 0;
/**
 * A content rating to be attributed to each source.
 */
var ContentRating;
(function (ContentRating) {
    ContentRating["EVERYONE"] = "EVERYONE";
    ContentRating["MATURE"] = "MATURE";
    ContentRating["ADULT"] = "ADULT";
})(ContentRating = exports.ContentRating || (exports.ContentRating = {}));

},{}],40:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],41:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],43:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],44:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],45:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],46:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],47:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./SourceStateManager"), exports);
__exportStar(require("./RequestInterceptor"), exports);
__exportStar(require("./DynamicUI"), exports);
__exportStar(require("./TrackedManga"), exports);
__exportStar(require("./SourceManga"), exports);
__exportStar(require("./TrackedMangaChapterReadAction"), exports);
__exportStar(require("./TrackerActionQueue"), exports);
__exportStar(require("./SearchField"), exports);
__exportStar(require("./RawData"), exports);

},{"./Chapter":7,"./ChapterDetails":6,"./Constants":8,"./DynamicUI":24,"./HomeSection":25,"./Languages":26,"./Manga":29,"./MangaTile":27,"./MangaUpdate":28,"./PagedResults":30,"./RawData":31,"./RequestHeaders":32,"./RequestInterceptor":33,"./RequestManager":34,"./RequestObject":35,"./ResponseObject":36,"./SearchField":37,"./SearchRequest":38,"./SourceInfo":39,"./SourceManga":40,"./SourceStateManager":41,"./SourceTag":42,"./TagSection":43,"./TrackedManga":45,"./TrackedMangaChapterReadAction":44,"./TrackerActionQueue":46}],48:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MundoMangaKun = exports.MundoMangaKunInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const MundoMangaKunParser_1 = require("./MundoMangaKunParser");
const BASE_DOMAIN = 'https://mundomangakun.com.br';
const method = 'GET';
exports.MundoMangaKunInfo = {
    version: '0.1',
    name: 'Mundo Mangá-kun',
    description: 'Extension that pulls manga from mundomangakun.com.brp',
    author: 'SuperTx2',
    authorWebsite: 'https://github.com/supertx2',
    icon: "icon.png",
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
    websiteBaseURL: BASE_DOMAIN,
    sourceTags: [
        {
            text: 'Portuguese',
            type: paperback_extensions_common_1.TagType.GREY,
        },
    ],
};
class MundoMangaKun extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.parser = new MundoMangaKunParser_1.Parser();
        this.requestManager = createRequestManager({
            requestsPerSecond: 3,
            requestTimeout: 100000,
            interceptor: {
                interceptRequest: (request) => __awaiter(this, void 0, void 0, function* () {
                    request.headers = this.constructHeaders();
                    return request;
                }),
                interceptResponse: (response) => __awaiter(this, void 0, void 0, function* () { return response; })
            }
        });
        this.cookies = [createCookie({ name: 'set', value: 'h=1', domain: BASE_DOMAIN })];
    }
    cloudflareBypassRequest() {
        return createRequestObject({
            url: `${BASE_DOMAIN}`,
            method,
        });
    }
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = createRequestObject({
                url: `${BASE_DOMAIN}/projeto/${mangaId}/`,
                method: 'GET',
            });
            const data = yield this.requestManager.schedule(request, 3);
            let manga = [];
            let $ = this.cheerio.load(data.data);
            return this.parser.parseMangaDetails($, mangaId);
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = createRequestObject({
                url: `${BASE_DOMAIN}/projeto/${mangaId}/`,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            return this.parser.parseChapters($, mangaId);
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = createRequestObject({
                url: `${BASE_DOMAIN}/leitor-online/projeto/${mangaId}/${chapterId}/#todas-as-paginas`,
                method: 'GET',
                cookies: [
                    createCookie({ name: 'apagarLuzes', value: '0', domain: 'mundomangakun.com.br', path: '/' }),
                    createCookie({
                        name: 'modoNavegacaoLeitor',
                        value: '#todas-as-paginas',
                        domain: 'mundomangakun.com.br',
                        path: '/'
                    }),
                    // createCookie({ name: '_ga', value: 'GA1.3.1857711392.1649606782', domain: 'mundomangakun.com.br', path:'/' }),
                    // createCookie({ name: '_gid', value: 'GA1.3.1857711392.1649606782', domain: 'mundomangakun.com.br', path:'/' })
                ],
            });
            const data = yield this.requestManager.schedule(request, 1);
            return this.parser.parseChapterDetails(data, mangaId, chapterId);
        });
    }
    getSearchResults(query, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = createRequestObject({
                url: `${BASE_DOMAIN}/leitor-online/?leitor_titulo_projeto=${query.title}&leitor_autor_projeto=&leitor_genero_projeto=&leitor_status_projeto=&leitor_ordem_projeto=ASC`,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(data.data);
            return this.parser.parseSearchResults($, query, metadata);
        });
    }
    getHomePageSections(sectionCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            // Let the app know what the homsections are without filling in the data
            let mostReadMangas = createHomeSection({ id: 'destaques', title: 'Destaques' });
            sectionCallback(mostReadMangas);
            let request = createRequestObject({
                url: BASE_DOMAIN,
                method: 'GET',
            });
            const data = yield this.requestManager.schedule(request, 2);
            let $ = this.cheerio.load(data.data);
            const popularMangas = this.parser.parseHomePageSections($);
            mostReadMangas.items = popularMangas;
            sectionCallback(mostReadMangas);
        });
    }
    getCloudflareBypassRequest() {
        return createRequestObject({
            url: 'https://mundomangakun.com.br/projeto/gleipnir/',
            method: "GET",
        });
    }
    constructHeaders(headers, refererPath) {
        headers = headers !== null && headers !== void 0 ? headers : {};
        headers['User-Agent'] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36";
        headers['referer'] = BASE_DOMAIN;
        headers['Host'] = `mundomangakun.com.br`;
        headers['Origin'] = BASE_DOMAIN;
        return headers;
    }
}
exports.MundoMangaKun = MundoMangaKun;

},{"./MundoMangaKunParser":49,"paperback-extensions-common":5}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const BASE_DOMAIN = 'https://mundomangakun.com.br';
const method = 'GET';
class Parser {
    parseMangaDetails($, mangaId) {
        const $infoElement = $(".main_container_projeto .container-fluid");
        const $infoText = $infoElement.find(".tabela_info_projeto tr");
        const titles = [$infoElement.find(".titulo_projeto").first().text().trim()];
        const image = $infoElement.find('.imagens_projeto_container img').attr('src');
        const status = $infoText.eq(5).find('td').eq(1).text() == "Em Andamento" ? paperback_extensions_common_1.MangaStatus.ONGOING : paperback_extensions_common_1.MangaStatus.COMPLETED;
        const author = $infoElement.find(".tabela_info_projeto tr").eq(1).find('td').eq(1).text();
        const artist = $infoElement.find(".tabela_info_projeto tr").eq(0).find('td').eq(1).text();
        const genres = [];
        $infoElement.find(".generos a").filter((i, e) => !!$(e).text()).toArray().map(e => {
            var _a;
            return genres.push({
                id: (_a = $(e).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(`${mangaId}/generos/`, '').replace('/', '/'),
                label: $(e).text().trim()
            });
        });
        let tags = [createTagSection({ id: 'genres', label: 'genres', tags: genres })];
        let summary = $infoElement.find(".conteudo_projeto").text().trim();
        return createManga({
            id: mangaId,
            rating: 1,
            views: 1,
            titles: titles,
            image: `${image}`,
            author: author,
            artist: artist,
            status: Number(status),
            // tags: tags,
            desc: summary
        });
    }
    parseChapters($, mangaId) {
        let chapters = [];
        for (let obj of $(".capitulos_leitor_online a").toArray()) {
            const $obj = $(obj);
            const name = $obj.text();
            const clickEvent = $obj.attr("onclick");
            const id = clickEvent === null || clickEvent === void 0 ? void 0 : clickEvent.substring(clickEvent.indexOf(mangaId), clickEvent.indexOf(`','tipo'`)).replaceAll('\\', '').replace(`${mangaId}/`, '').split('/')[0];
            let chapNum = Number(name.replace(/\D/g, '')) || 0;
            // If we parsed a bad ID out, don't include this in our list
            if (!id) {
                continue;
            }
            chapters.push(createChapter({
                id: id,
                mangaId: mangaId,
                chapNum: chapNum,
                langCode: paperback_extensions_common_1.LanguageCode.BRAZILIAN,
                name: name,
            }));
        }
        return chapters;
    }
    parseChapterDetails(data, mangaId, chapterId) {
        let pagesString = data.data;
        const pagesStartIndex = pagesString.indexOf("var paginas = ");
        pagesString = pagesString.substring(pagesStartIndex, pagesString.length - 1);
        pagesString = pagesString.substring(0, pagesString.indexOf(']') + 1).replace('var paginas = ', '');
        const pagesObject = JSON.parse(pagesString);
        pagesObject.map(p => encodeURIComponent(p));
        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: pagesObject,
            longStrip: false
        });
    }
    parseSearchResults($, query, metadata) {
        var _a;
        let mangaTiles = [];
        for (let manga of $(".leitor_online_container article").toArray()) {
            const $manga = $(manga);
            const $titleA = $manga.find(".titulo_manga_item a");
            const title = $titleA.text();
            const id = (_a = $titleA.attr("href")) === null || _a === void 0 ? void 0 : _a.replace(`${BASE_DOMAIN}/projeto/`, '').replace('/', '');
            const image = $manga.find('.container_imagem').css('background-image').slice(4, -1).replace(/"/g, "");
            mangaTiles.push(createMangaTile({
                id: id,
                title: createIconText({ text: title }),
                image: `${image}`
            }));
        }
        return createPagedResults({
            results: mangaTiles
        });
    }
    parseHomePageSections($) {
        let popularMangas = [];
        const context = $(".lancamentos_main_container .container-obras-populares article");
        for (let obj of context.toArray()) {
            const $obj = $(obj);
            let img = $obj.find('.container_imagem').css('background-image').slice(4, -1).replace(/"/g, "");
            const titleLink = $('a', $(obj)).attr('href');
            let id = titleLink.replace('https://mundomangakun.com.br/projeto/', '').replace('/', '');
            const title = id.replaceAll('-', ' ').toLowerCase().replace(/\b[a-z]/g, function (letter) {
                return letter.toUpperCase();
            });
            // If there was not a valid ID parsed, skip this entry
            if (!id) {
                continue;
            }
            let foundItem = false;
            for (let item of popularMangas) {
                if (item.id == id) {
                    foundItem = true;
                    break;
                }
            }
            if (foundItem) {
                continue;
            }
            popularMangas.push(createMangaTile({
                id: id,
                title: createIconText({ text: title }),
                image: img
            }));
        }
        return popularMangas;
    }
}
exports.Parser = Parser;

},{"paperback-extensions-common":5}]},{},[48])(48)
});

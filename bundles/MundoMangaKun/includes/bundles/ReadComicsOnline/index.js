(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
exports.APIWrapper = void 0;
require("./models/impl_export");
class APIWrapper {
    getMangaDetails(source, mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            return source.getMangaDetails(mangaId);
        });
    }
    getChapters(source, mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            return source.getChapters(mangaId);
        });
    }
    getChapterDetails(source, mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            return source.getChapterDetails(mangaId, chapterId);
        });
    }
    searchRequest(source, query, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return source.searchRequest(query, metadata);
        });
    }
    getTags(source) {
        return __awaiter(this, void 0, void 0, function* () {
            return source.getTags();
        });
    }
    filterUpdatedManga(source, time, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            // This method uses a callback to get multiple batches of updated manga. Aggrigate the data here
            // and return it all at once as a response
            var updateList = [];
            let callbackFunc = function (updates) {
                updateList.push(updates);
            };
            yield source.filterUpdatedManga(callbackFunc, time, ids);
            return updateList;
        });
    }
    getHomePageSections(source) {
        return __awaiter(this, void 0, void 0, function* () {
            // This method uses a callback to get multiple batches of a homesection. Aggrigate data and return all at once
            var sections = [];
            let callbackFunc = function (section) {
                sections.push(section);
            };
            yield source.getHomePageSections(callbackFunc);
            return sections;
        });
    }
    /**
     * Performs a 'get more' request. Usually this is done when a homesection has it's 'View More' button tapped, and the user
     * is starting to scroll through all of the available titles in each section.
     * It is recommended that when you write your tests for a source, that you run one test using this function,
     * for each homepageSectionId that the source offers, if those sections are expected to traverse multiple pages
     * @param source
     * @param homepageSectionId
     * @param metadata
     * @param resultPageLimiter How many pages this should attempt to iterate through at most. This prevents
     * you from being in an infinite loop. Defaults to 3.
     */
    getViewMoreItems(source, homepageSectionId, metadata, resultPageLimiter = 3) {
        return __awaiter(this, void 0, void 0, function* () {
            var results = [];
            // This may (and likely will) run multiple times, for multiple pages. Aggrigate up to the page limiter
            for (let i = 0; i < resultPageLimiter; i++) {
                let sourceResults = yield source.getViewMoreItems(homepageSectionId, metadata);
                if (sourceResults === null || sourceResults.results.length == 0) {
                    console.error(`getViewMoreItems was asked to run to a maximum of ${resultPageLimiter} pages, but retrieved no results on page ${i}`);
                    return results;
                }
                results = results.concat(sourceResults.results);
                metadata = sourceResults.metadata;
                // If there is no other pages available, meaning the metadata is empty, exit the loop and do not try again
                if (!sourceResults.metadata) {
                    break;
                }
            }
            return results;
        });
    }
    getWebsiteMangaDirectory(source, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return source.getWebsiteMangaDirectory(metadata);
        });
    }
}
exports.APIWrapper = APIWrapper;

},{"./models/impl_export":40}],2:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Source = void 0;
class Source {
    constructor(cheerio) {
        // <-----------        OPTIONAL METHODS        -----------> //
        /**
         * Manages the ratelimits and the number of requests that can be done per second
         * This is also used to fetch pages when a chapter is downloading
         */
        this.requestManager = createRequestManager({
            requestsPerSecond: 2.5,
            requestTimeout: 5000
        });
        this.cheerio = cheerio;
    }
    /**
     * (OPTIONAL METHOD) This function is called when ANY request is made by the Paperback Application out to the internet.
     * By modifying the parameter and returning it, the user can inject any additional headers, cookies, or anything else
     * a source may need to load correctly.
     * The most common use of this function is to add headers to image requests, since you cannot directly access these requests through
     * the source implementation itself.
     *
     * NOTE: This does **NOT** influence any requests defined in the source implementation. This function will only influence requests
     * which happen behind the scenes and are not defined in your source.
     */
    globalRequestHeaders() { return {}; }
    globalRequestCookies() { return []; }
    /**
     * A stateful source may require user input.
     * By supplying this value to the Source, the app will render your form to the user
     * in the application settings.
     */
    getAppStatefulForm() { return createUserForm({ formElements: [] }); }
    /**
     * When the Advanced Search is rendered to the user, this skeleton defines what
     * fields which will show up to the user, and returned back to the source
     * when the request is made.
     */
    getAdvancedSearchForm() { return createUserForm({ formElements: [] }); }
    /**
     * (OPTIONAL METHOD) Given a manga ID, return a URL which Safari can open in a browser to display.
     * @param mangaId
     */
    getMangaShareUrl(mangaId) { return null; }
    /**
     * If a source is secured by Cloudflare, this method should be filled out.
     * By returning a request to the website, this source will attempt to create a session
     * so that the source can load correctly.
     * Usually the {@link Request} url can simply be the base URL to the source.
     */
    getCloudflareBypassRequest() { return null; }
    /**
     * (OPTIONAL METHOD) A function which communicates with a given source, and returns a list of all possible tags which the source supports.
     * These tags are generic and depend on the source. They could be genres such as 'Isekai, Action, Drama', or they can be
     * listings such as 'Completed, Ongoing'
     * These tags must be tags which can be used in the {@link searchRequest} function to augment the searching capability of the application
     */
    getTags() { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) A function which should scan through the latest updates section of a website, and report back with a list of IDs which have been
     * updated BEFORE the supplied timeframe.
     * This function may have to scan through multiple pages in order to discover the full list of updated manga.
     * Because of this, each batch of IDs should be returned with the mangaUpdatesFoundCallback. The IDs which have been reported for
     * one page, should not be reported again on another page, unless the relevent ID has been detected again. You do not want to persist
     * this internal list between {@link Request} calls
     * @param mangaUpdatesFoundCallback A callback which is used to report a list of manga IDs back to the API
     * @param time This function should find all manga which has been updated between the current time, and this parameter's reported time.
     *             After this time has been passed, the system should stop parsing and return
     */
    filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) A function which should readonly allf the available homepage sections for a given source, and return a {@link HomeSection} object.
     * The sectionCallback is to be used for each given section on the website. This may include a 'Latest Updates' section, or a 'Hot Manga' section.
     * It is recommended that before anything else in your source, you first use this sectionCallback and send it {@link HomeSection} objects
     * which are blank, and have not had any requests done on them just yet. This way, you provide the App with the sections to render on screen,
     * which then will be populated with each additional sectionCallback method called. This is optional, but recommended.
     * @param sectionCallback A callback which is run for each independant HomeSection.
     */
    getHomePageSections(sectionCallback) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) This function will take a given homepageSectionId and metadata value, and with this information, should return
     * all of the manga tiles supplied for the given state of parameters. Most commonly, the metadata value will contain some sort of page information,
     * and this request will target the given page. (Incrementing the page in the response so that the next call will return relevent data)
     * @param homepageSectionId The given ID to the homepage defined in {@link getHomePageSections} which this method is to readonly moreata about
     * @param metadata This is a metadata parameter which is filled our in the {@link getHomePageSections}'s return
     * function. Afterwards, if the metadata value returned in the {@link PagedResults} has been modified, the modified version
     * will be supplied to this function instead of the origional {@link getHomePageSections}'s version.
     * This is useful for keeping track of which page a user is on, pagnating to other pages as ViewMore is called multiple times.
     */
    getViewMoreItems(homepageSectionId, metadata) { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) This function is to return the entire library of a manga website, page by page.
     * If there is an additional page which needs to be called, the {@link PagedResults} value should have it's metadata filled out
     * with information needed to continue pulling information from this website.
     * Note that if the metadata value of {@link PagedResults} is undefined, this method will not continue to run when the user
     * attempts to readonly morenformation
     * @param metadata Identifying information as to what the source needs to call in order to readonly theext batch of data
     * of the directory. Usually this is a page counter.
     */
    getWebsiteMangaDirectory(metadata) { return Promise.resolve(null); }
    // <-----------        PROTECTED METHODS        -----------> //
    // Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
    convertTime(timeAgo) {
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
    /**
     * When a function requires a POST body, it always should be defined as a JsonObject
     * and then passed through this function to ensure that it's encoded properly.
     * @param obj
     */
    urlEncodeObject(obj) {
        let ret = {};
        for (const entry of Object.entries(obj)) {
            ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
        }
        return ret;
    }
}
exports.Source = Source;

},{}],3:[function(require,module,exports){
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

},{"./Source":2}],4:[function(require,module,exports){
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

},{"./APIWrapper":1,"./base":3,"./models":41}],5:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createChapterDetails = function (chapterDetails) {
    return chapterDetails;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],7:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createChapter = function (chapter) {
    return chapter;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],9:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],10:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createHomeSection = function (section) {
    return section;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createMangaTile = function (mangaTile) {
    return mangaTile;
};
_global.createIconText = function (iconText) {
    return iconText;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],14:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],15:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createMangaUpdates = function (update) {
    return update;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],16:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],17:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createManga = function (manga) {
    return manga;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],19:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createPagedResults = function (update) {
    return update;
};
_global.isOAuthTokenExpired = function (token) {
    return (new Date().getMilliseconds() / 1000) > (token.createdAt + token.expiresIn - 3600);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],20:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],21:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createPagedResults = function (update) {
    return update;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],22:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],23:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],24:[function(require,module,exports){
(function (global){(function (){
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
const _global = global;
_global.createRequestManager = function (info) {
    const axios = require('axios');
    return Object.assign(Object.assign({}, info), { schedule: function (request, retryCount) {
            var _a, _b, _c, _d, _e;
            return __awaiter(this, void 0, void 0, function* () {
                // Append any cookies into the header properly
                let headers = (_a = request.headers) !== null && _a !== void 0 ? _a : {};
                let cookieData = '';
                for (let cookie of (_b = request.cookies) !== null && _b !== void 0 ? _b : [])
                    cookieData += `${cookie.name}=${cookie.value};`;
                headers['cookie'] = cookieData;
                // If no user agent has been supplied, default to a basic Paperback-iOS agent
                headers['user-agent'] = (_c = headers["user-agent"]) !== null && _c !== void 0 ? _c : 'Paperback-iOS';
                // If we are using a urlencoded form data as a post body, we need to decode the request for Axios
                let decodedData = request.data;
                if ((_d = headers['content-type']) === null || _d === void 0 ? void 0 : _d.includes('application/x-www-form-urlencoded')) {
                    decodedData = "";
                    for (let attribute in request.data) {
                        if (decodedData) {
                            decodedData += "&";
                        }
                        decodedData += `${attribute}=${request.data[attribute]}`;
                    }
                }
                // We must first get the response object from Axios, and then transcribe it into our own Response type before returning
                let response = yield axios({
                    url: `${request.url}${(_e = request.param) !== null && _e !== void 0 ? _e : ''}`,
                    method: request.method,
                    headers: headers,
                    data: decodedData,
                    timeout: info.requestTimeout || 0
                });
                return Promise.resolve(createResponseObject({
                    data: response.data,
                    status: response.status,
                    headers: response.headers,
                    request: request
                }));
            });
        } });
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"axios":"axios"}],25:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],26:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createCookie = function (cookie) {
    return cookie;
};
_global.createRequestObject = function (request) {
    return request;
};
_global.createRequestObject = function (requestObject) {
    return requestObject;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],27:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],28:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createResponseObject = function (responseObject) {
    return responseObject;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],29:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],30:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createSearchRequest = function (searchRequest) {
    return searchRequest;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],31:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],32:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],33:[function(require,module,exports){
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

},{}],34:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createTagSection = function (tagSection) {
    return tagSection;
};
_global.createTag = function (tag) {
    return tag;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],35:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],36:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createTrackObject = function (trackObject) {
    return trackObject;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],37:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],38:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createUserForm = function (userForm) {
    return userForm;
};
_global.createTextFieldObject = function (textField) {
    return textField;
};
_global.createToggleFieldObject = function (toggleField) {
    return toggleField;
};
_global.createPickerFieldObject = function (pickerField) {
    return pickerField;
};
_global.createComboFieldObject = function (comboField) {
    return comboField;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],39:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],40:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./Chapter/_impl");
require("./ChapterDetails/_impl");
require("./HomeSection/_impl");
require("./Manga/_impl");
require("./MangaTile/_impl");
require("./RequestObject/_impl");
require("./ResponseObject/_impl");
require("./SearchRequest/_impl");
require("./TagSection/_impl");
require("./PagedResults/_impl");
require("./RequestManager/_impl");
require("./TrackObject/_impl");
require("./OAuth/_impl");
require("./MangaUpdate/_impl");
require("./UserForm/_impl");

},{"./Chapter/_impl":7,"./ChapterDetails/_impl":5,"./HomeSection/_impl":10,"./Manga/_impl":17,"./MangaTile/_impl":13,"./MangaUpdate/_impl":15,"./OAuth/_impl":19,"./PagedResults/_impl":21,"./RequestManager/_impl":24,"./RequestObject/_impl":26,"./ResponseObject/_impl":28,"./SearchRequest/_impl":30,"./TagSection/_impl":34,"./TrackObject/_impl":36,"./UserForm/_impl":38}],41:[function(require,module,exports){
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
__exportStar(require("./TrackObject"), exports);
__exportStar(require("./OAuth"), exports);
__exportStar(require("./UserForm"), exports);

},{"./Chapter":8,"./ChapterDetails":6,"./Constants":9,"./HomeSection":11,"./Languages":12,"./Manga":18,"./MangaTile":14,"./MangaUpdate":16,"./OAuth":20,"./PagedResults":22,"./RequestHeaders":23,"./RequestManager":25,"./RequestObject":27,"./ResponseObject":29,"./SearchRequest":31,"./SourceInfo":32,"./SourceTag":33,"./TagSection":35,"./TrackObject":37,"./UserForm":39}],42:[function(require,module,exports){
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
exports.ReadComicsOnline = exports.ReadComicsOnlineInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const READCOMICSONLINE_DOMAIN = 'https://readcomicsonline.ru';
exports.ReadComicsOnlineInfo = {
    version: '0.4.1',
    name: 'ReadComicsOnline',
    description: 'Extension that pulls western comics from ReadComicsOnline.ru',
    author: 'Conrad Weiser',
    authorWebsite: 'http://github.com/conradweiser',
    icon: "logo.png",
    hentaiSource: false,
    websiteBaseURL: READCOMICSONLINE_DOMAIN,
};
class ReadComicsOnline extends paperback_extensions_common_1.Source {
    getMangaShareUrl(mangaId) { return `${READCOMICSONLINE_DOMAIN}/comic/${mangaId}`; }
    getMangaDetails(mangaId) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            let request = createRequestObject({
                url: `${READCOMICSONLINE_DOMAIN}/comic/${mangaId}`,
                method: 'GET'
            });
            const data = yield this.requestManager.schedule(request, 1);
            let manga = [];
            let $ = this.cheerio.load(data.data);
            let titles = [$($('.listmanga-header').toArray()[0]).text().trim()];
            let image = $('img', $('.boxed')).attr('src');
            let status, author, released, views, rating = 0;
            let tags = [createTagSection({ id: 'genres', label: 'genres', tags: [] })];
            let i = 0;
            for (let item of $('dd', $('.dl-horizontal')).toArray()) {
                switch (i) {
                    case 0: {
                        i++;
                        continue;
                    }
                    case 1: {
                        // Comic Status
                        if ($(item).text().toLowerCase().includes("ongoing")) {
                            status = paperback_extensions_common_1.MangaStatus.ONGOING;
                        }
                        else {
                            status = paperback_extensions_common_1.MangaStatus.COMPLETED;
                        }
                        i++;
                        continue;
                    }
                    case 2: {
                        // Date of release
                        released = (_a = ($(item).text().trim())) !== null && _a !== void 0 ? _a : undefined;
                        i++;
                        continue;
                    }
                    case 3: {
                        i++;
                        continue;
                    }
                    case 4: {
                        // Genres (Cannot be parsed due to ::before and ::after tags, look into this later)
                        i++;
                        continue;
                    }
                    case 5: {
                        views = (_b = Number($(item).text())) !== null && _b !== void 0 ? _b : -1;
                        i++;
                        continue;
                    }
                    case 6: {
                        // Rating
                        rating = (_c = Number($('#item-rating', $(item)).attr('data-score'))) !== null && _c !== void 0 ? _c : -1;
                        i++;
                        continue;
                    }
                }
                i = 0;
            }
            let summary = $('p', $('.well')).text().trim();
            return createManga({
                id: mangaId,
                rating: rating,
                titles: titles,
                image: `http:${image}`,
                status: Number(status),
                lastUpdate: released,
                tags: tags,
                desc: summary
            });
        });
    }
    getChapters(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let request = createRequestObject({
                url: `${READCOMICSONLINE_DOMAIN}/comic/${mangaId}`,
                method: "GET"
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let chapters = [];
            for (let obj of $('li', $('.chapters')).toArray()) {
                let id = (_a = $('a', $(obj)).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(`${READCOMICSONLINE_DOMAIN}/comic/${mangaId}/`, '');
                let chapNum = Number(id);
                let name = $('a', $(obj)).text().trim();
                let time = new Date($('.date-chapter-title-rtl', $(obj)).text().trim());
                // If we parsed a bad ID out, don't include this in our list
                if (!id) {
                    continue;
                }
                chapters.push(createChapter({
                    id: id,
                    mangaId: mangaId,
                    chapNum: chapNum,
                    langCode: paperback_extensions_common_1.LanguageCode.ENGLISH,
                    name: name,
                    time: time
                }));
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = createRequestObject({
                url: `${READCOMICSONLINE_DOMAIN}/comic/${mangaId}/${chapterId}`,
                method: 'GET',
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let pages = [];
            // Get all of the pages
            let pageListContext = $('#page-list').toArray()[0];
            let numPages = $('option', $(pageListContext)).toArray().length;
            for (let i = 1; i <= numPages; i++) {
                // Pages when below 10 are listed as 01, 02 etc. Enforce this
                let y;
                if (i < 10) {
                    y = '0' + i + '.jpg';
                }
                else {
                    y = i + '.jpg';
                }
                pages.push(`${READCOMICSONLINE_DOMAIN}/uploads/manga/${mangaId}/chapters/${chapterId}/${y}`);
            }
            return createChapterDetails({
                id: chapterId,
                mangaId: mangaId,
                pages: pages,
                longStrip: false
            });
        });
    }
    searchRequest(query, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let request = createRequestObject({
                url: `${READCOMICSONLINE_DOMAIN}/search`,
                method: "GET"
            });
            const data = yield this.requestManager.schedule(request, 1);
            let mangaTiles = [];
            let obj = JSON.parse(data.data);
            // Parse the json context
            for (let entry of obj.suggestions) {
                // Is this relevent to the query?
                if (entry.value.toLowerCase().includes((_a = query.title) === null || _a === void 0 ? void 0 : _a.toLowerCase())) {
                    let image = `${READCOMICSONLINE_DOMAIN}/uploads/manga/${entry.data}/cover/cover_250x350.jpg`;
                    mangaTiles.push(createMangaTile({
                        id: entry.data,
                        title: createIconText({ text: entry.value }),
                        image: image
                    }));
                }
            }
            // Because we're reading JSON, there will never be another page to search through
            return createPagedResults({
                results: mangaTiles
            });
        });
    }
    getHomePageSections(sectionCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Let the app know what the homsections are without filling in the data
            let latest_comics = createHomeSection({ id: 'latest_comics', title: 'LATEST COMICS' });
            sectionCallback(latest_comics);
            // Make the request and fill out available titles
            let request = createRequestObject({
                url: `${READCOMICSONLINE_DOMAIN}`,
                method: 'GET'
            });
            const data = yield this.requestManager.schedule(request, 1);
            let popularComics = [];
            let $ = this.cheerio.load(data.data);
            let context = $('.list-container').toArray()[2];
            for (let obj of $('.col-sm-6', $(context)).toArray()) {
                let img = `https:${$('img', $(obj)).attr('src')}`;
                let id = (_a = $('a', $(obj)).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(`${READCOMICSONLINE_DOMAIN}/comic/`, '');
                let title = $('strong', $(obj)).text().trim();
                // If there was not a valid ID parsed, skip this entry
                if (!id) {
                    continue;
                }
                // Ensure that this title doesn't exist in the tile list already, as it causes weird glitches if so.
                // This unfortunately makes this method O(n^2) but there never will be many elements
                let foundItem = false;
                for (let item of popularComics) {
                    if (item.id == id) {
                        foundItem = true;
                        break;
                    }
                }
                if (foundItem) {
                    continue;
                }
                popularComics.push(createMangaTile({
                    id: id,
                    title: createIconText({ text: title }),
                    image: img
                }));
            }
            latest_comics.items = popularComics;
            sectionCallback(latest_comics);
        });
    }
}
exports.ReadComicsOnline = ReadComicsOnline;

},{"paperback-extensions-common":4}]},{},[42])(42)
});

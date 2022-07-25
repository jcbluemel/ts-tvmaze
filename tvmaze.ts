import axios from "axios";
import * as $ from 'jquery';

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $searchForm = $("#searchForm");

const BASE_TVMAZE_URL = "http://api.tvmaze.com";
const NO_IMG_URL = 'https://tinyurl.com/tv-missing';

interface ResponseInterface {
  config: object;
  data: ShowAPIDataInterface[];
  headers: object;
  request: XMLHttpRequest;
}

interface ShowAPIDataInterface {
  score: number;
  show: {id: number, name: string, summary: string, image: {medium: string}}
}

interface ShowData {
  id: number, name: string, summary: string, image: string
}

/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */

async function getShowsByTerm(term: string): Promise<ShowData[]> {
  const shows: ResponseInterface = await axios.get(
    `${BASE_TVMAZE_URL}/search/shows`,
    { params: { "q": term } }
  );
  // console.log("shows", shows);

  const showDetails: ShowData[] = shows.data.map(s => {
    return {
      id: s.show.id,
      name: s.show.name,
      summary: s.show.summary,
      image: s.show.image.medium || NO_IMG_URL
    }
  });
  // console.log(showDetails);

  return showDetails;
}


/** Given list of shows, create markup for each and to DOM */

function populateShows(shows: ShowData[]) {
  $showsList.empty();

  for (let show of shows) {
    const $show = $(
      `<div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img
              src="${show.image}"
              alt="${show.name}"
              class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `);

    $showsList.append($show);
  }
}


/** Handle search form submission: get shows from API and display.
 *    Hide episodes area (that only gets shown if they ask for episodes)
 */

async function searchForShowAndDisplay() {
  const term = $("#searchForm-term").val() as string;
  // alt: if typeof term === string
  const shows = await getShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}

$searchForm.on("submit", async function (evt) {
  evt.preventDefault();
  await searchForShowAndDisplay();
});


interface IEpisode {
  id: number,
  name: string,
  season: string,
  number: string
}


/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number }
 */

async function getEpisodesOfShow(id: string): Promise<IEpisode[]> {
  const response = await axios.get(
    `${BASE_TVMAZE_URL}/shows/${id}/episodes`
  );
  // console.log("result", response);

  const epList: IEpisode[] = response.data.map((e: IEpisode) => {
    return {
      id: e.id,
      name: e.name,
      season: e.season,
      number: e.number
    }
  });
  // console.log(epList);

  return epList;
}

/** Write a clear docstring for this function... */

function populateEpisodes(episodes: IEpisode[]) {

  $episodesArea.empty();
  for (let episode of episodes) {
    const $episode = $(
      `<li data-episode-id=${episode.id}>
        ${episode.name} (season ${episode.season}, episode ${episode.number})
      </li>`
    );
    $episodesArea.append($episode);
  }
}


/** Handle episode button click: get episodes from API and display.
 */

 async function searchForEpisodesAndDisplay(id: string) {
  const episodes = await getEpisodesOfShow(id);

  $episodesArea.show();
  populateEpisodes(episodes);
}

$showsList.on('click', '.Show-getEpisodes', async function (evt) {
  const showId = $(evt.target).closest('.Show').attr('data-show-id') as string;

  await searchForEpisodesAndDisplay(showId);
});
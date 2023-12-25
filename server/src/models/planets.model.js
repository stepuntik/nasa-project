const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const planets = require('./planets.mongo.js');
const launchesMongo = require('./launches.mongo.js');

const loadPlanetsData = () => {
  return new Promise((resolve, reject) => {
    const isHabitablePlanet = (planet) =>
      planet['koi_disposition'] === 'CONFIRMED' &&
      planet['koi_insol'] > 0.36 &&
      planet['koi_insol'] < 1.11 &&
      planet['koi_prad'] < 1.6;

    fs.createReadStream(
      path.join(__dirname, '..', '..', 'data', 'kepler_data.csv')
    )
      .pipe(parse({ comment: '#', columns: true }))
      .on('data', async (data) => {
        if (isHabitablePlanet(data)) {
          await savePlanet(data);
        }
      })
      .on('error', (err) => {
        console.log(err);
        reject(err);
      })
      .on('end', async () => {
        const countPlanetsFound = (await getAllPlanets()).length;
        console.log(`${countPlanetsFound} habitable planets found!`);
        resolve();
      });
  });
};

const getAllPlanets = async () => {
  return await planets.find({}, { _id: 0, __v: 0 });
};

const savePlanet = async (planet) => {
  try {
    await planets.updateOne(
      {
        keplerName: planet.kepler_name,
      },
      { keplerName: planet.kepler_name },
      { upsert: true }
    );
  } catch (err) {
    console.error(`Could no save planet ${err}`);
  }
};

module.exports = {
  loadPlanetsData,
  getAllPlanets,
};

import { DigitalOcean } from 'dots-wrapper';

const myApiToken = process.env.DIGITAL_OCEAN_TOKEN;
const digitalOcean = new DigitalOcean(myApiToken);

export const doImgId = process.env.DIGITAL_OCEAN_IMAGE_ID;

export default digitalOcean
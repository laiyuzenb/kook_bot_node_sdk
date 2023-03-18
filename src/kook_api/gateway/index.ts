import axios, { AxiosResponse } from "axios";

function index(): Promise<AxiosResponse> {
  return axios.get("/gateway/index");
}

const gateway_api = {
  index
};

export default gateway_api;

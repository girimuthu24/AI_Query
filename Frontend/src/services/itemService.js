// All API calls for the /items/ endpoint are organized here.
// Import axiosInstance so all requests share the same config and interceptors.

import axiosInstance from '../api/axiosInstance';

const ENDPOINT = '/items/';

// GET all items
export const getItems = () => axiosInstance.get(ENDPOINT);

// GET single item by id
export const getItem = (id) => axiosInstance.get(`${ENDPOINT}${id}/`);

// POST create new item
export const createItem = (data) => axiosInstance.post(ENDPOINT, data);

// PUT update existing item by id
export const updateItem = (id, data) => axiosInstance.put(`${ENDPOINT}${id}/`, data);

// DELETE item by id
export const deleteItem = (id) => axiosInstance.delete(`${ENDPOINT}${id}/`);

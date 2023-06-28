import { DataSource } from "typeorm";
import ormconfig from "../../config/ormconfig";

export default new DataSource(ormconfig)
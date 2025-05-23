/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License.AGPL.txt in the project root for license information.
 */

import { MaintenanceNotification, Team } from "@gitpod/gitpod-protocol";
import { Entity, Column, PrimaryColumn } from "typeorm";
import { TypeORM } from "../typeorm";

@Entity()
// on DB but not Typeorm: @Index("ind_lastModified", ["_lastModified"])   // DBSync
export class DBTeam implements Team {
    @PrimaryColumn(TypeORM.UUID_COLUMN_TYPE)
    id: string;

    @Column("varchar")
    name: string;

    @Column("varchar")
    slug: string;

    @Column("varchar")
    creationTime: string;

    @Column()
    markedDeleted?: boolean;

    @Column({ default: false })
    maintenanceMode?: boolean;

    @Column("json", { nullable: true })
    maintenanceNotification?: MaintenanceNotification;
}

import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Department } from '../entities/department.entity';
import { Seminar } from '../entities/seminar.entity';
import { Tag } from '../entities/tag.entity';
export declare class SeedService implements OnModuleInit {
    private readonly userRepository;
    private readonly departmentRepository;
    private readonly seminarRepository;
    private readonly tagRepository;
    private readonly logger;
    constructor(userRepository: Repository<User>, departmentRepository: Repository<Department>, seminarRepository: Repository<Seminar>, tagRepository: Repository<Tag>);
    onModuleInit(): Promise<void>;
    seedAll(force?: boolean): Promise<void>;
}

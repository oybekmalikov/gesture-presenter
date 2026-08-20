import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Seminar } from './seminar.entity';

@Entity('saved_seminars')
@Unique(['userId', 'seminarId'])
export class SavedSeminar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  seminarId: string;

  @ManyToOne(() => Seminar, (s) => s.savedBy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seminarId' })
  seminar: Seminar;

  @CreateDateColumn()
  createdAt: Date;
}

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

@Entity('likes')
@Unique(['userId', 'seminarId'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  seminarId: string;

  @ManyToOne(() => Seminar, (s) => s.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seminarId' })
  seminar: Seminar;

  @CreateDateColumn()
  createdAt: Date;
}

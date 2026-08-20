import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Seminar } from './seminar.entity';

@Entity('seminar_view_logs')
export class SeminarViewLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  seminarId: string;

  @ManyToOne(() => Seminar, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seminarId' })
  seminar: Seminar;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  viewedAt: Date;
}

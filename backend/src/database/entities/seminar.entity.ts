import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { SeminarStatus, FileAccess } from '../../common/enums';
import { User } from './user.entity';
import { Department } from './department.entity';
import { Tag } from './tag.entity';

@Entity('seminars')
export class Seminar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  coverImageUrl: string;

  @Column()
  authorId: string;

  @ManyToOne(() => User, (u) => u.seminars, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  /** Seminar kimga mo'ljallangan (masalan bo'lim boshligi) */
  @Column({ nullable: true })
  targetUserId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'targetUserId' })
  targetUser: User;

  @Column({ nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column({ type: 'enum', enum: SeminarStatus, default: SeminarStatus.DRAFT })
  status: SeminarStatus;

  @Column({ type: 'enum', enum: FileAccess, default: FileAccess.PUBLIC })
  fileAccess: FileAccess;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({ default: false })
  isLive: boolean;

  @Column({ default: false })
  isRecorded: boolean;

  @Column({ default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany('SeminarFile', 'seminar')
  files: any[];

  @ManyToMany(() => Tag, (tag) => tag.seminars, { cascade: true })
  @JoinTable({
    name: 'seminar_tags',
    joinColumn: { name: 'seminarId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @OneToMany('Like', 'seminar')
  likes: any[];

  @OneToMany('Comment', 'seminar')
  comments: any[];

  @OneToMany('SavedSeminar', 'seminar')
  savedBy: any[];

  @OneToMany('LiveSession', 'seminar')
  liveSessions: any[];
}

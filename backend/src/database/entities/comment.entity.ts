import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Seminar } from './seminar.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  seminarId: string;

  @ManyToOne(() => Seminar, (s) => s.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seminarId' })
  seminar: Seminar;

  @Column({ type: 'text' })
  content: string;

  /** Parent comment for nested replies */
  @Column({ nullable: true })
  parentId?: string;

  @ManyToOne(() => Comment, (c) => c.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Comment;

  @OneToMany(() => Comment, (c) => c.parent)
  replies: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

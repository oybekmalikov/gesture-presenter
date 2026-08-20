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
import { Role } from '../../common/enums/role.enum';
import { Gender } from '../../common/enums';
import { Department } from './department.entity';
import { SubDepartment } from './sub-department.entity';
import { Position } from './position.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  fio: string;

  @Column({ length: 50, unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  /** Qo'lda yoziladigan lavozim nomi */
  @Column({ length: 255, nullable: true })
  lavozim: string;

  @Column({ nullable: true })
  positionId: string;

  @ManyToOne(() => Position, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'positionId' })
  position: Position;

  @Column({ nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, (dep) => dep.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column({ nullable: true })
  subDepartmentId: string;

  @ManyToOne(() => SubDepartment, (sub) => sub.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'subDepartmentId' })
  subDepartment: SubDepartment;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations — lazy references
  @OneToMany('Seminar', 'author')
  seminars: any[];

  @OneToMany('Like', 'user')
  likes: any[];

  @OneToMany('Comment', 'user')
  comments: any[];

  @OneToMany('Notification', 'user')
  notifications: any[];
}

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
import { Department } from './department.entity';

@Entity('sub_departments')
export class SubDepartment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  departmentId: string;

  @ManyToOne(() => Department, (dep) => dep.subDepartments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('User', 'subDepartment')
  users: any[];
}

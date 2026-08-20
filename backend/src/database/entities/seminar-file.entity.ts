import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Seminar } from './seminar.entity';

@Entity('seminar_files')
export class SeminarFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  seminarId: string;

  @ManyToOne(() => Seminar, (s) => s.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seminarId' })
  seminar: Seminar;

  @Column({ length: 500 })
  originalName: string;

  @Column({ length: 500 })
  storedName: string;

  /** pdf, glb, pptx, step, image, video */
  @Column({ length: 50 })
  fileType: string;

  @Column({ length: 100, nullable: true })
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  /** Lokal fayl yo'li (./uploads/pdf/xxx.pdf) */
  @Column({ type: 'text' })
  storagePath: string;

  /** Agar konvertatsiya qilingan bo'lsa — asl format (pptx, step) */
  @Column({ length: 20, nullable: true })
  convertedFrom: string;

  @Column({ default: 0 })
  sortOrder: number;

  /** Admin tomonidan o'chirishga qo'yilgan sana */
  @Column({ type: 'timestamp', nullable: true })
  markedForDeletionAt: Date;

  /** Fayl to'liq o'chirilishi kerak bo'lgan muddat */
  @Column({ type: 'timestamp', nullable: true })
  deletionScheduledDate: Date;

  /** O'chirish sababi (masalan: eski fayl, kam foydalanilgan) */
  @Column({ length: 500, nullable: true })
  deletionReason: string;

  /** O'chirishga qo'ygan admin ID si */
  @Column({ nullable: true })
  markedByUserId: string;

  @CreateDateColumn()
  createdAt: Date;
}


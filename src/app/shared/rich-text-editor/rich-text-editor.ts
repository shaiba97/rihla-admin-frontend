import { Component, model, AfterViewInit, ElementRef, viewChild } from '@angular/core';
import {
  LucideBold, LucideItalic, LucideUnderline, LucideList, LucideListOrdered,
  LucideHeading1, LucideHeading2, LucideHeading3, LucideLink,
} from '@lucide/angular';

@Component({
  selector: 'app-rich-text-editor',
  imports: [
    LucideBold, LucideItalic, LucideUnderline, LucideList, LucideListOrdered,
    LucideHeading1, LucideHeading2, LucideHeading3, LucideLink,
  ],
  template: `
    <div dir="rtl" class="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--bg-card)]">
      <!-- Toolbar -->
      <div role="toolbar" aria-label="أدوات التنسيق" class="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-base)]">
        <button type="button" (click)="exec('formatBlock', '<h1>')" aria-label="عنوان" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--primary-light)] hover:text-[var(--primary)] text-[var(--text-muted)] transition-colors" title="عنوان"><svg aria-hidden="true" lucideHeading1 class="w-4 h-4"></svg></button>
        <button type="button" (click)="exec('formatBlock', '<h2>')" aria-label="عنوان فرعي" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--primary-light)] hover:text-[var(--primary)] text-[var(--text-muted)] transition-colors" title="عنوان فرعي"><svg aria-hidden="true" lucideHeading2 class="w-4 h-4"></svg></button>
        <button type="button" (click)="exec('formatBlock', '<h3>')" aria-label="عنوان ثالث" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--primary-light)] hover:text-[var(--primary)] text-[var(--text-muted)] transition-colors" title="عنوان ثالث"><svg aria-hidden="true" lucideHeading3 class="w-4 h-4"></svg></button>
        <span class="w-px h-6 bg-[var(--border)] mx-1"></span>
        <button type="button" (click)="exec('bold')" aria-label="عريض" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--primary-light)] hover:text-[var(--primary)] text-[var(--text-muted)] transition-colors font-bold" title="عريض"><svg aria-hidden="true" lucideBold class="w-4 h-4"></svg></button>
        <button type="button" (click)="exec('italic')" aria-label="مائل" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--primary-light)] hover:text-[var(--primary)] text-[var(--text-muted)] transition-colors italic" title="مائل"><svg aria-hidden="true" lucideItalic class="w-4 h-4"></svg></button>
        <button type="button" (click)="exec('underline')" aria-label="تسطير" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--primary-light)] hover:text-[var(--primary)] text-[var(--text-muted)] transition-colors underline" title="تسطير"><svg aria-hidden="true" lucideUnderline class="w-4 h-4"></svg></button>
        <span class="w-px h-6 bg-[var(--border)] mx-1"></span>
        <button type="button" (click)="exec('insertUnorderedList')" aria-label="قائمة نقطية" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--primary-light)] hover:text-[var(--primary)] text-[var(--text-muted)] transition-colors" title="قائمة نقطية"><svg aria-hidden="true" lucideList class="w-4 h-4"></svg></button>
        <button type="button" (click)="exec('insertOrderedList')" aria-label="قائمة مرقمة" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--primary-light)] hover:text-[var(--primary)] text-[var(--text-muted)] transition-colors" title="قائمة مرقمة"><svg aria-hidden="true" lucideListOrdered class="w-4 h-4"></svg></button>
        <span class="w-px h-6 bg-[var(--border)] mx-1"></span>
        <button type="button" (click)="insertLink()" aria-label="رابط" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--primary-light)] hover:text-[var(--primary)] text-[var(--text-muted)] transition-colors" title="رابط"><svg aria-hidden="true" lucideLink class="w-4 h-4"></svg></button>
      </div>
      <!-- Editor -->
      <div #editorRef
        role="textbox"
        aria-multiline="true"
        aria-label="محرر النص"
        [attr.contenteditable]="true"
        (input)="onInput()"
        class="min-h-[300px] p-4 text-sm text-[var(--text-primary)] leading-relaxed outline-none focus:ring-2 focus:ring-[var(--primary)]/20 prose prose-sm max-w-none"
        [innerHTML]="value()">
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    [contenteditable] h1 { font-size: 1.5rem; font-weight: 800; margin: 1rem 0 0.5rem; }
    [contenteditable] h2 { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
    [contenteditable] h3 { font-size: 1.1rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
    [contenteditable] ul, [contenteditable] ol { padding-right: 1.5rem; margin: 0.5rem 0; }
    [contenteditable] li { margin: 0.25rem 0; }
    [contenteditable] a { color: var(--primary); text-decoration: underline; }
    [contenteditable] p { margin: 0.5rem 0; }
    [contenteditable]:empty:before { content: 'ابدأ الكتابة...'; color: var(--text-muted); }
  `],
})
export class RichTextEditorComponent implements AfterViewInit {
  value = model<string>('');
  editorRef = viewChild<ElementRef<HTMLDivElement>>('editorRef');

  ngAfterViewInit(): void {
    const el = this.editorRef()?.nativeElement;
    if (el && !el.innerHTML) el.innerHTML = this.value();
  }

  exec(command: string, value?: string): void {
    document.execCommand(command, false, value);
    this.editorRef()?.nativeElement.focus();
    this.onInput();
  }

  insertLink(): void {
    const url = prompt('أدخل رابط:');
    if (url) {
      document.execCommand('createLink', false, url);
      this.onInput();
    }
  }

  onInput(): void {
    this.value.set(this.editorRef()?.nativeElement.innerHTML ?? '');
  }
}

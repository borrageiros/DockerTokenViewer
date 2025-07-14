export interface Column {
	key: string;
	label: string;
	sortable?: boolean;
	width?: string;
	align?: 'left' | 'center' | 'right';
	visible?: boolean;
}

export type Row = Record<string, unknown>;

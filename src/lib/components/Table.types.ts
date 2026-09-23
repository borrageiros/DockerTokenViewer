export interface Column {
	key: string;
	label: string;
	header?: string;
	sortable?: boolean;
	width?: string;
	align?: 'left' | 'center' | 'right';
	visible?: boolean;
}

export type Row = Record<string, unknown>;

export interface Column {
	key: string;
	label: string;
	width?: string;
	align?: 'left' | 'center' | 'right';
	sortable?: boolean;
}

export interface Row {
	[key: string]: unknown;
}

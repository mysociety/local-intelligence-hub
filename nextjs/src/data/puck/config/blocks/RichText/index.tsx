import React from 'react';
import { ComponentConfig } from "@measured/puck";
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './customRichTextStyles.css';

const Parchment = Quill.import('parchment');
const SizeClass = new Parchment.Attributor.Class('size', 'size', {
    scope: Parchment.Scope.INLINE,
    whitelist: ['small', 'medium', 'large']
});
Quill.register(SizeClass, true);

export type RichTextProps = {
    content: string
};

const modules = {
    toolbar: [
        [{ 'size': ['small', 'medium', 'large' ] }], 
        [ 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link'],
        ['clean']
    ],
};

const formats = [
    'size', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link'
];

export const RichText: ComponentConfig<RichTextProps> = {
    label: "RichText",
    fields: {
        content: {
            type: "custom",
            render: ({ onChange, value }) => (
                <ReactQuill
                    value={value}
                    onChange={(e: string) => onChange(e)}
                    modules={modules}
                    formats={formats}
                />
            ),
        }
    },
    render: ({ content }) => {
        return (
            <div className='max-w-prose'
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    },
};

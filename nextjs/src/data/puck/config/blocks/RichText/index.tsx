import React from 'react';
import { ComponentConfig } from "@measured/puck";
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './customRichTextStyles.css';

const Parchment = Quill.import('parchment');
const SizeClass = new Parchment.Attributor.Class('size', 'size', {
    scope: Parchment.Scope.INLINE,
    whitelist: ['small', 'medium', 'large', 'huge']
});
Quill.register(SizeClass, true);

export type RichTextProps = {
    width: string
    content: string
};

const modules = {
    toolbar: [
        [{ 'size': ['small', 'medium', 'large', 'huge' ] }], 
        [ 'bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link'],
        ['clean']
    ],
};

const formats = [
    'size', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link'
];

export const RichText: ComponentConfig<RichTextProps> = {
    label: "RichText",
    fields: {
        width: {
            type: "radio",
            options: [
                { label: "Standard", value: "standard" },
                { label: "Full", value: "full" },
            ],
        },
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
    defaultProps: {
        width: 'standard',
        content: ''
    },
    render: ({ width, content }) => {
        return (
            <div className={`${width === "standard" ? 'max-w-[50ch]' : ''} mb-4 text-meepGray-500`}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    },
};

import React from 'react';
import GenericListPage from '../../components/GenericListPage';
import { postService } from '../../services/postService';

const Posts: React.FC = () => (
  <GenericListPage
    title="Posts"
    columns={[
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Título' },
      { key: 'body', label: 'Contenido' },
    ]}
    fetchData={() => postService.getAll()}
    onDelete={(id) => postService.delete(id)}
    createPath="/posts/create"
    editPath="/posts/update"
  />
);

export default Posts;
